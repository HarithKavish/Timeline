/**
 * The News domain's shapes. Unlike every other domain in this build, these
 * are backed by a real pipeline (`workers/news`): live RSS ingestion, then
 * cross-source dedup and clustering into topics and threads. `NewsArticle`
 * carries a real `url` — the `Source.urlPlaceholder` convention used
 * elsewhere in this repo deliberately does not apply here.
 */

export type NewsOutletId = string;

/**
 * Geographic scope. International excludes the home nation (India);
 * National/State/City narrow from there (India / Tamil Nadu / Rajapalayam).
 * Every article and topic inherits its category from the outlet that
 * produced it — clustering never crosses categories.
 */
export type NewsCategory = 'international' | 'national' | 'state' | 'city';

export const NEWS_CATEGORIES: NewsCategory[] = ['international', 'national', 'state', 'city'];

export const NEWS_CATEGORY_LABEL: Record<NewsCategory, string> = {
  international: 'International',
  national: 'National',
  state: 'State',
  city: 'City',
};

export interface NewsOutlet {
  id: NewsOutletId;
  name: string;
  homepage: string;
  region: string;
  category: NewsCategory;
}

/** One ingested feed item, after dedup — a single outlet's report of one development. */
export interface NewsArticle {
  id: string;
  outletId: NewsOutletId;
  outletName: string;
  title: string;
  url: string;
  publishedAt: string;
  fetchedAt: string;
  summary: string | null;
}

/**
 * One distinct development within a topic's story, in the order it
 * happened. `articles` are every outlet judged to be reporting *this same*
 * development, earliest first — that's the corroboration a reader sees.
 */
export interface NewsThreadEntry {
  id: string;
  occurredAt: string;
  headline: string;
  articles: NewsArticle[];
}

export type NewsTopicStatus = 'developing' | 'settled';

/** A cluster of articles judged to report the same real-world story. */
export interface NewsTopic {
  id: string;
  title: string;
  category: NewsCategory;
  firstSeenAt: string;
  lastUpdatedAt: string;
  outletCount: number;
  articleCount: number;
  entryCount: number;
  status: NewsTopicStatus;
}

export interface NewsTopicDetail extends NewsTopic {
  thread: NewsThreadEntry[];
  outlets: NewsOutlet[];
}

export interface NewsTimelineQuery {
  q?: string;
  category?: NewsCategory;
  outletId?: NewsOutletId;
  status?: NewsTopicStatus;
  from?: string;
  to?: string;
  sort?: 'newest' | 'oldest';
  offset?: number;
  limit?: number;
}

export interface NewsTimelineResponse {
  items: NewsTopic[];
  total: number;
  offset: number;
  limit: number;
  outlets: NewsOutlet[];
}

/** The category-first homepage view: the latest N topics per category, newest first. */
export type CategorizedTopics = Record<NewsCategory, NewsTopic[]>;
