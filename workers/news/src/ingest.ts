import { parseFeed } from './feed';
import { embedText } from './embeddings';
import { generateNarrative } from './narrative';
import { translateTitle } from './translate';
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
const CATEGORY_PRIORITY: NewsCategory[] = ['national', 'state', 'district', 'city', 'international'];

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
      await processItem(env, outlet, item);
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
  outlet: Outlet,
  item: { title: string; link: string; summary: string | null; publishedAt: string | null },
): Promise<void> {
  const db = env.DB;
  const url = canonicalizeUrl(item.link);
  const id = await hashId(url);
  if (await articleExists(db, id)) return;

  // Only outlets tagged non-English pay for a translation call — known-
  // English outlets (the large majority) never spend a call they don't need.
  const titleEn = outlet.language === 'en' ? null : await translateTitle(env.AI, item.title);
  // Best available English text, used wherever a fallback headline is
  // needed below — never the untranslated original when a translation
  // exists, even in a degraded/fallback path.
  const displayTitle = titleEn ?? item.title;

  const now = new Date();
  const article: NewArticle = {
    id,
    outletId: outlet.id,
    title: item.title,
    titleEn,
    url,
    publishedAt: item.publishedAt ?? now.toISOString(),
    fetchedAt: now.toISOString(),
    summary: item.summary,
  };

  const embedding = await embedText(env.AI, `${item.title}. ${item.summary ?? ''}`.trim());
  if (!embedding) {
    // Embedding failed — can't compare against anything, so the safest
    // outcome is a standalone topic rather than dropping the article.
    await createTopic(db, crypto.randomUUID(), crypto.randomUUID(), article, [], displayTitle, outlet.category);
    return;
  }

  const candidateTopics = await getCandidateTopics(db, outlet.category, now);
  const topicMatch = pickTopic(embedding, candidateTopics);

  if (!topicMatch) {
    // generateNarrative reads item.title/item.summary directly (not the
    // translated version) and is instructed to always answer in English —
    // it handles non-English source text itself, in the same call, rather
    // than needing a separate pre-translation pass.
    const opening = await generateNarrative(env.AI, item.title, [], {
      title: item.title,
      summary: item.summary,
      outletName: outlet.name,
    });
    const headline = opening?.text ?? displayTitle;
    await createTopic(db, crypto.randomUUID(), crypto.randomUUID(), article, embedding, headline, outlet.category);
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
    { title: item.title, summary: item.summary, outletName: outlet.name },
  );

  if (result?.isDuplicate && entryMatch) {
    await addCorroboratingArticle(db, topicMatch.topicId, entryMatch.entryId, article);
  } else {
    const headline = result?.text ?? displayTitle;
    await addThreadEntry(db, topicMatch.topicId, crypto.randomUUID(), article, embedding, headline);
  }
}
