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
