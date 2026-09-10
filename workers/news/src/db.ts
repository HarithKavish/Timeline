import { weightedCentroid } from './text';
import { TOPIC_WINDOW_DAYS, type CandidateEntry, type CandidateTopic } from './cluster';
import type { NewsCategory, TermVector } from './types';
import { OUTLETS } from './outlets';

export async function ensureOutlets(db: D1Database): Promise<void> {
  const statements = OUTLETS.map((outlet) =>
    db
      .prepare(
        `INSERT INTO outlets (id, name, homepage, feed_url, region, category) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, homepage = excluded.homepage,
           feed_url = excluded.feed_url, region = excluded.region, category = excluded.category`,
      )
      .bind(outlet.id, outlet.name, outlet.homepage, outlet.feedUrl, outlet.region, outlet.category),
  );
  await db.batch(statements);
}

export async function articleExists(db: D1Database, id: string): Promise<boolean> {
  const row = await db.prepare('SELECT 1 FROM articles WHERE id = ?').bind(id).first();
  return row !== null;
}

/** Candidate topics are scoped to one category — a national Indian story can never match against an unrelated international one. */
export async function getCandidateTopics(
  db: D1Database,
  category: NewsCategory,
  now: Date,
): Promise<CandidateTopic[]> {
  const cutoff = new Date(now.getTime() - TOPIC_WINDOW_DAYS * 86_400_000).toISOString();
  const { results } = await db
    .prepare('SELECT id, centroid_json FROM topics WHERE category = ? AND last_updated_at >= ?')
    .bind(category, cutoff)
    .all<{ id: string; centroid_json: string }>();
  return results.map((row) => ({ id: row.id, centroid: JSON.parse(row.centroid_json) as TermVector }));
}

export async function getThreadEntries(db: D1Database, topicId: string): Promise<CandidateEntry[]> {
  const { results } = await db
    .prepare('SELECT id, vector_json FROM thread_entries WHERE topic_id = ?')
    .bind(topicId)
    .all<{ id: string; vector_json: string }>();
  return results.map((row) => ({ id: row.id, vector: JSON.parse(row.vector_json) as TermVector }));
}

export interface NewArticle {
  id: string;
  outletId: string;
  title: string;
  url: string;
  publishedAt: string;
  fetchedAt: string;
  summary: string | null;
}

export async function createTopic(
  db: D1Database,
  topicId: string,
  entryId: string,
  article: NewArticle,
  vector: TermVector,
  category: NewsCategory,
): Promise<void> {
  await db.batch([
    db
      .prepare(
        'INSERT INTO topics (id, title, category, first_seen_at, last_updated_at, centroid_json) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(topicId, article.title, category, article.publishedAt, article.publishedAt, JSON.stringify(vector)),
    db
      .prepare(
        'INSERT INTO thread_entries (id, topic_id, occurred_at, headline, vector_json) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(entryId, topicId, article.publishedAt, article.title, JSON.stringify(vector)),
    insertArticleStatement(db, article, entryId, topicId),
  ]);
}

export async function addThreadEntry(
  db: D1Database,
  topicId: string,
  entryId: string,
  article: NewArticle,
  vector: TermVector,
): Promise<void> {
  await db.batch([
    db
      .prepare(
        'INSERT INTO thread_entries (id, topic_id, occurred_at, headline, vector_json) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(entryId, topicId, article.publishedAt, article.title, JSON.stringify(vector)),
    insertArticleStatement(db, article, entryId, topicId),
  ]);
  await recomputeTopic(db, topicId);
}

export async function addCorroboratingArticle(
  db: D1Database,
  topicId: string,
  entryId: string,
  article: NewArticle,
): Promise<void> {
  await insertArticleStatement(db, article, entryId, topicId).run();
  await recomputeTopic(db, topicId);
}

function insertArticleStatement(db: D1Database, article: NewArticle, entryId: string, topicId: string) {
  return db
    .prepare(
      `INSERT INTO articles (id, outlet_id, thread_entry_id, topic_id, title, url, published_at, fetched_at, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      article.id,
      article.outletId,
      entryId,
      topicId,
      article.title,
      article.url,
      article.publishedAt,
      article.fetchedAt,
      article.summary,
    );
}

/** Recomputes a topic's centroid and last_updated_at from its current thread entries. */
async function recomputeTopic(db: D1Database, topicId: string): Promise<void> {
  const [entries, topicRow] = await Promise.all([
    db
      .prepare('SELECT occurred_at, vector_json FROM thread_entries WHERE topic_id = ?')
      .bind(topicId)
      .all<{ occurred_at: string; vector_json: string }>(),
    db.prepare('SELECT last_updated_at FROM topics WHERE id = ?').bind(topicId).first<{ last_updated_at: string }>(),
  ]);
  if (entries.results.length === 0 || !topicRow) return;

  const centroid = weightedCentroid(
    entries.results.map((row) => ({
      occurredAt: row.occurred_at,
      vector: JSON.parse(row.vector_json) as TermVector,
    })),
    Date.now(),
  );
  const latestEntryAt = entries.results.map((row) => row.occurred_at).sort().at(-1)!;
  const lastUpdatedAt = latestEntryAt > topicRow.last_updated_at ? latestEntryAt : topicRow.last_updated_at;

  await db
    .prepare('UPDATE topics SET centroid_json = ?, last_updated_at = ? WHERE id = ?')
    .bind(JSON.stringify(centroid), lastUpdatedAt, topicId)
    .run();
}
