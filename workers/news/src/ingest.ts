import { parseFeed } from './feed';
import { buildVector } from './text';
import { pickTopic, pickEntry } from './cluster';
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
import type { Env } from './types';

const FETCH_TIMEOUT_MS = 10_000;

export async function runIngest(env: Env): Promise<void> {
  await ensureOutlets(env.DB);

  for (const outlet of OUTLETS) {
    try {
      const items = await fetchOutlet(outlet.feedUrl);
      for (const item of items) {
        if (!item.link) continue;
        await processItem(env.DB, outlet.id, item);
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
  db: D1Database,
  outletId: string,
  item: { title: string; link: string; summary: string | null; publishedAt: string | null },
): Promise<void> {
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

  const vector = buildVector(item.title, item.summary);
  const candidateTopics = await getCandidateTopics(db, now);
  const topicMatch = pickTopic(vector, candidateTopics);

  if (!topicMatch) {
    await createTopic(db, crypto.randomUUID(), crypto.randomUUID(), article, vector);
    return;
  }

  const entries = await getThreadEntries(db, topicMatch.topicId);
  const entryMatch = pickEntry(vector, entries);

  if (entryMatch?.isDuplicate) {
    await addCorroboratingArticle(db, topicMatch.topicId, entryMatch.entryId, article);
  } else {
    await addThreadEntry(db, topicMatch.topicId, crypto.randomUUID(), article, vector);
  }
}
