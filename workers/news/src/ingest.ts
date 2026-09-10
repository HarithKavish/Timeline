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
import { OUTLETS } from './outlets';
import type { Env, NewsCategory } from './types';

const FETCH_TIMEOUT_MS = 10_000;

export async function runIngest(env: Env): Promise<void> {
  await ensureOutlets(env.DB);

  for (const outlet of OUTLETS) {
    try {
      const items = await fetchOutlet(outlet.feedUrl);
      for (const item of items) {
        if (!item.link) continue;
        await processItem(env, outlet.id, outlet.name, outlet.category, item);
      }
    } catch (error) {
      console.error(`[news-ingest] ${outlet.id} failed:`, error);
    }
  }
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
