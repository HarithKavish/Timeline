/**
 * The News service — the one boundary in this build that is not backed by
 * `src/data/mock`. Every function here does a real `fetch` against the
 * Timeline News worker (`workers/news`), which itself pulled the data from
 * live RSS feeds. See that worker's README for the ingestion and clustering
 * pipeline.
 */

import { newsEndpoints } from './endpoints';
import type { NewsOutlet, NewsTimelineQuery, NewsTimelineResponse, NewsTopicDetail } from '../types/news';

export class NewsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NewsServiceError';
  }
}

async function getJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new NewsServiceError('The news service is unreachable right now.');
  }
  if (!response.ok) {
    if (response.status === 404) throw new NewsServiceError('That topic was not found.');
    throw new NewsServiceError(`The news service returned an unexpected error (${response.status}).`);
  }
  return (await response.json()) as T;
}

function toSearchParams(query: NewsTimelineQuery): string {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.outletId) params.set('outletId', query.outletId);
  if (query.status) params.set('status', query.status);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.sort) params.set('sort', query.sort);
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  return params.toString();
}

/** GET /topics — the news timeline: one row per topic, most recently updated first by default. */
export async function getNewsTopics(query: NewsTimelineQuery = {}): Promise<NewsTimelineResponse> {
  return getJson<NewsTimelineResponse>(newsEndpoints.newsTopics(toSearchParams(query)));
}

/** GET /topics/:id — a topic's full thread: every development, chronological, with corroborating sources. */
export async function getNewsTopic(id: string): Promise<NewsTopicDetail> {
  return getJson<NewsTopicDetail>(newsEndpoints.newsTopic(id));
}

/** GET /outlets — the outlet registry, for the filter UI. */
export async function getNewsOutlets(): Promise<NewsOutlet[]> {
  return getJson<NewsOutlet[]>(newsEndpoints.newsOutlets());
}
