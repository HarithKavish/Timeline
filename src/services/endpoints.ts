/**
 * The future HTTP surface.
 *
 * Nothing here is called in this build — it is the contract the mock service
 * implements in memory, written down so the backend stage has an exact target.
 * Every function in `musicService.ts` maps to one entry below, takes the same
 * arguments, and returns the same shape.
 *
 * Stage 2 replaces the body of each service function with a fetch against these
 * paths. No component changes.
 */

export const API_BASE = '/api';

export const endpoints = {
  /** GET /api/music/overview → MusicOverview */
  musicOverview: () => `${API_BASE}/music/overview`,

  /** GET /api/music/search?q=…&types=creator,work → SearchResponse */
  musicSearch: (query: string) => `${API_BASE}/music/search?q=${encodeURIComponent(query)}`,

  /**
   * GET /api/music/timeline?…TimelineQuery → TimelineResponse
   * Filters serialise exactly as they appear in the URL query string today, so
   * the browser URL and the API call already agree.
   */
  musicTimeline: (search: string) => `${API_BASE}/music/timeline${search ? `?${search}` : ''}`,

  /** GET /api/music/creators → Paged<CreatorSummary> */
  musicCreators: () => `${API_BASE}/music/creators`,

  /** GET /api/music/creators/:slug → CreatorDetail */
  musicCreator: (slug: string) => `${API_BASE}/music/creators/${slug}`,

  /** GET /api/music/works/:slug → WorkDetail */
  musicWork: (slug: string) => `${API_BASE}/music/works/${slug}`,

  /** GET /api/music/releases/:slug → ReleaseDetail (stage 2) */
  musicRelease: (slug: string) => `${API_BASE}/music/releases/${slug}`,

  /** GET /api/sources/:id → Source */
  source: (id: string) => `${API_BASE}/sources/${encodeURIComponent(id)}`,
} as const;

export type Endpoints = typeof endpoints;

/**
 * The News domain is served by a separate, real backend (`workers/news`,
 * a Cloudflare Worker + D1 — see its README) rather than `API_BASE`: it has
 * its own ingestion cron and its own origin. `VITE_NEWS_API_BASE` is set in
 * `.env` per environment; see `.env.example`.
 */
export const NEWS_API_BASE: string =
  import.meta.env.VITE_NEWS_API_BASE ?? 'http://localhost:8787';

export const newsEndpoints = {
  /** GET {NEWS_API_BASE}/topics/by-category?limit=… → CategorizedTopics */
  newsCategorized: (limit: number) => `${NEWS_API_BASE}/topics/by-category?limit=${limit}`,

  /** GET {NEWS_API_BASE}/topics?… → NewsTimelineResponse */
  newsTopics: (search: string) => `${NEWS_API_BASE}/topics${search ? `?${search}` : ''}`,

  /** GET {NEWS_API_BASE}/topics/:id → NewsTopicDetail */
  newsTopic: (id: string) => `${NEWS_API_BASE}/topics/${encodeURIComponent(id)}`,

  /** GET {NEWS_API_BASE}/outlets → NewsOutlet[] */
  newsOutlets: () => `${NEWS_API_BASE}/outlets`,
} as const;
