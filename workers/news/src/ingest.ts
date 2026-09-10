import { parseFeed } from './feed';
import { embedText } from './embeddings';
import { generateNarrative } from './narrative';
import { pickTopic, pickEntry, DIRECT_DUPLICATE_THRESHOLD } from './cluster';
import { canonicalizeUrl, hashId } from './ids';
import {
  addCorroboratingArticle,
  addThreadEntry,
  articleExists,
  createTopic,
  ensureOutlets,
  getCandidateTopics,
  getThreadEntries,
  type NewArticle,
} from './db';
import { OUTLETS, type Outlet } from './outlets';
import type { Env, FeedItem, NewsCategory } from './types';

const FETCH_TIMEOUT_MS = 10_000;

/**
 * International is the highest-volume tier (5 established Western
 * newsrooms) and already has the deepest backlog, so it's the one that can
 * best afford to lose a round to a tight subrequest budget. Processing
 * order puts it last, so a mid-cycle cutoff costs International coverage
 * before it costs the smaller, easily-starved tiers.
 */
const CATEGORY_PRIORITY: NewsCategory[] = ['national', 'state', 'city', 'international'];

export async function runIngest(env: Env): Promise<void> {
  await ensureOutlets(env.DB);

  const perOutlet: Array<{ outlet: Outlet; items: FeedItem[] }> = [];
  for (const outlet of OUTLETS) {
    try {
      const items = (await fetchOutlet(outlet.feedUrl)).filter((item) => item.link);
      perOutlet.push({ outlet, items });
    } catch (error) {
      console.error(`[news-ingest] ${outlet.id} failed:`, error);
    }
  }
  perOutlet.sort(
    (a, b) => CATEGORY_PRIORITY.indexOf(a.outlet.category) - CATEGORY_PRIORITY.indexOf(b.outlet.category),
  );

  // Round-robin across outlets, not outlet-by-outlet: real production
  // traffic hit the Workers free-plan subrequest budget (50/invocation)
  // before every new article across 11 feeds could be processed, and
  // outlet-by-outlet order (plus, initially, round-robin in the array's
  // International-first order) meant National/State/City got a single item
  // processed only after International had already taken its share, every
  // single cycle (confirmed via wrangler tail: those three categories sat
  // at zero topics for over an hour of real cron runs). The category sort
  // above plus round-robin here means a budget cutoff costs the
  // already-well-covered tier first, not the starved ones.
  // Interleaving means a budget cutoff costs every category roughly the
  // same instead of starving whichever tier is last.
  const queue = interleave(
    perOutlet.map(({ outlet, items }) => items.map((item) => ({ outlet, item }))),
  );

  for (const { outlet, item } of queue) {
    try {
      await processItem(env, outlet.id, outlet.name, outlet.category, item);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[news-ingest] ${outlet.id} item failed:`, message);
      if (message.includes('Too many subrequests')) break; // budget exhausted — remaining items retry next cycle
    }
  }
}

function interleave<T>(groups: T[][]): T[] {
  const result: T[] = [];
  const maxLen = groups.reduce((max, group) => Math.max(max, group.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const group of groups) {
      const value = group[i];
      if (value !== undefined) result.push(value);
    }
  }
  return result;
}

async function fetchOutlet(feedUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'TimelineNewsBot/1.0 (+https://timeline.harithkavish.com; static news timeline, low frequency)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[news-ingest] ${feedUrl} returned ${response.status}`);
      return [];
    }
    return parseFeed(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

async function processItem(
  env: Env,
  outletId: string,
  outletName: string,
  category: NewsCategory,
  item: { title: string; link: string; summary: string | null; publishedAt: string | null },
): Promise<void> {
  const db = env.DB;
  const url = canonicalizeUrl(item.link);
  const id = await hashId(url);
  if (await articleExists(db, id)) return;

  const now = new Date();
  const article: NewArticle = {
    id,
    outletId,
    title: item.title,
    url,
    publishedAt: item.publishedAt ?? now.toISOString(),
    fetchedAt: now.toISOString(),
    summary: item.summary,
  };

  const embedding = await embedText(env.AI, `${item.title}. ${item.summary ?? ''}`.trim());
  if (!embedding) {
    // Embedding failed — can't compare against anything, so the safest
    // outcome is a standalone topic rather than dropping the article.
    await createTopic(db, crypto.randomUUID(), crypto.randomUUID(), article, [], article.title, category);
    return;
  }

  const candidateTopics = await getCandidateTopics(db, category, now);
  const topicMatch = pickTopic(embedding, candidateTopics);

  if (!topicMatch) {
    const opening = await generateNarrative(env.AI, item.title, [], {
      title: item.title,
      summary: item.summary,
      outletName,
    });
    const headline = opening?.text ?? article.title;
    await createTopic(db, crypto.randomUUID(), crypto.randomUUID(), article, embedding, headline, category);
    return;
  }

  const entries = await getThreadEntries(db, topicMatch.topicId);
  const entryMatch = pickEntry(embedding, entries);

  if (entryMatch && entryMatch.score >= DIRECT_DUPLICATE_THRESHOLD) {
    // High-confidence corroboration — no ambiguity worth spending an LLM call on.
    await addCorroboratingArticle(db, topicMatch.topicId, entryMatch.entryId, article);
    return;
  }

  const result = await generateNarrative(
    env.AI,
    topicMatch.title,
    entries.map((entry) => entry.headline),
    { title: item.title, summary: item.summary, outletName },
  );

  if (result?.isDuplicate && entryMatch) {
    await addCorroboratingArticle(db, topicMatch.topicId, entryMatch.entryId, article);
  } else {
    const headline = result?.text ?? article.title;
    await addThreadEntry(db, topicMatch.topicId, crypto.randomUUID(), article, embedding, headline);
  }
}
