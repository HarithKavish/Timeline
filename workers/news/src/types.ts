export interface Env {
  DB: D1Database;
  AI: Ai;
}

/** One parsed, not-yet-deduped item read off a feed. */
export interface FeedItem {
  title: string;
  link: string;
  summary: string | null;
  /** ISO 8601, or null when the feed omits a date and none can be parsed. */
  publishedAt: string | null;
}

/** A dense semantic embedding (bge-m3, 1024 dimensions) — see src/embeddings.ts. */
export type Embedding = number[];

/**
 * Geographic scope. Assigned per outlet (an outlet's whole feed is one
 * scope) and inherited by every article and topic it produces — clustering
 * only ever compares articles within the same category, so a national
 * Indian story can never merge with an unrelated international one just
 * because they share vocabulary.
 */
export type NewsCategory = 'international' | 'national' | 'state' | 'district' | 'city';

/* ---- Public API response shapes — mirrored by src/types/news.ts in the frontend ---- */

export interface PublicOutlet {
  id: string;
  name: string;
  homepage: string;
  region: string;
  category: NewsCategory;
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
  category: NewsCategory;
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

/** The category-first homepage view: the latest N topics per category, newest first. */
export type CategorizedTopics = Record<NewsCategory, PublicTopic[]>;
