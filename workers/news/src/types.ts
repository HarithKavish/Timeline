export interface Env {
  DB: D1Database;
}

/** One parsed, not-yet-deduped item read off a feed. */
export interface FeedItem {
  title: string;
  link: string;
  summary: string | null;
  /** ISO 8601, or null when the feed omits a date and none can be parsed. */
  publishedAt: string | null;
}

/** Sparse bag-of-terms weight vector, keyed by token (entities prefixed `ent:`). */
export type TermVector = Record<string, number>;

/* ---- Public API response shapes — mirrored by src/types/news.ts in the frontend ---- */

export interface PublicOutlet {
  id: string;
  name: string;
  homepage: string;
  region: string;
}

export interface PublicArticle {
  id: string;
  outletId: string;
  outletName: string;
  title: string;
  url: string;
  publishedAt: string;
  fetchedAt: string;
  summary: string | null;
}

export interface PublicThreadEntry {
  id: string;
  occurredAt: string;
  headline: string;
  articles: PublicArticle[];
}

export type TopicStatus = 'developing' | 'settled';

export interface PublicTopic {
  id: string;
  title: string;
  firstSeenAt: string;
  lastUpdatedAt: string;
  outletCount: number;
  articleCount: number;
  entryCount: number;
  status: TopicStatus;
}

export interface PublicTopicDetail extends PublicTopic {
  thread: PublicThreadEntry[];
  outlets: PublicOutlet[];
}

export interface TopicsResponse {
  items: PublicTopic[];
  total: number;
  offset: number;
  limit: number;
  outlets: PublicOutlet[];
}
