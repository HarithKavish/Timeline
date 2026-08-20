/**
 * The API boundary.
 *
 * These request/response shapes are the contract between the UI and the data
 * source. Today they are served by an in-memory mock (`src/services`); the next
 * stage swaps in a real backend behind the same shapes without touching the UI.
 * See `src/services/endpoints.ts` for the intended HTTP mapping.
 */

import type { EntityId, Paged, Relationship, Source } from './common';
import type {
  Creator,
  CreatorRole,
  Film,
  Label,
  Language,
  MusicType,
  Person,
  ProductionContext,
  Recording,
  Release,
  ReleaseClassification,
  ReleaseEvent,
  ReleaseType,
  TimelineEntry,
  Work,
} from './music';

export type SortDirection = 'asc' | 'desc';

export type DurationBucket = 'lt2' | '2to4' | '4to6' | '6to10' | 'gte10';

export interface DurationBucketDescriptor {
  id: DurationBucket;
  label: string;
  minSeconds: number;
  /** Exclusive upper bound; `null` means unbounded. */
  maxSeconds: number | null;
}

/**
 * Every discovery surface — timeline, creator page, search results — reads the
 * same filter object, so filters behave identically everywhere.
 */
export interface TimelineQuery {
  domain?: 'music';
  /** Free-text term applied to titles, films and creator names. */
  q?: string;
  creatorId?: EntityId;
  /** Restrict `creatorId` to a specific role, e.g. composer only. */
  creatorRole?: CreatorRole;
  roles?: CreatorRole[];
  languages?: Language[];
  releaseTypes?: ReleaseType[];
  classifications?: ReleaseClassification[];
  contexts?: ProductionContext[];
  musicTypes?: MusicType[];
  durationBuckets?: DurationBucket[];
  yearFrom?: number;
  yearTo?: number;
  /** Include later appearances (compilations, reissues) of a recording. */
  includeSubsequentReleases?: boolean;
  sort?: SortDirection;
  offset?: number;
  limit?: number;
}

export interface YearBucket {
  year: number;
  count: number;
}

export interface TimelineResponse extends Paged<TimelineEntry> {
  /** Year histogram for the *filtered* set, used by the density strip. */
  histogram: YearBucket[];
  /** Full year span of the catalogue, independent of the current filters. */
  span: { from: number; to: number };
  /** Entries whose date is unknown and therefore excluded from ordering. */
  undatedCount: number;
}

export interface CreatorSummary {
  creator: Creator;
  person?: Person;
  workCount: number;
  releaseCount: number;
  filmCount: number;
  /** First and last dated appearance in the catalogue. */
  activeSpan: { from: number | null; to: number | null };
  topRoles: CreatorRole[];
  /** Works per year, for the career ridge. */
  histogram: YearBucket[];
}

export interface CreatorDetail extends CreatorSummary {
  collaborators: Array<{
    creatorId: EntityId;
    slug: string;
    name: string;
    role: CreatorRole;
    count: number;
  }>;
  films: Film[];
  sources: Source[];
}

export interface WorkDetail {
  work: Work;
  film?: Film;
  /** Every catalogued recording of this work, earliest first. */
  recordings: Array<{
    recording: Recording;
    /** Releases carrying this recording, with their dating events. */
    appearances: Array<{
      release: Release;
      event?: ReleaseEvent;
      label?: Label;
      trackNumber: number;
    }>;
  }>;
  credits: {
    work: ResolvedCreditGroup[];
    recording: ResolvedCreditGroup[];
    release: ResolvedCreditGroup[];
  };
  relatedWorks: Array<{
    relationship: Relationship;
    work: Work;
    direction: 'outgoing' | 'incoming';
  }>;
  /**
   * Structural neighbours, derived from the catalogue rather than from an
   * explicit relationship record.
   */
  related: {
    sameRelease: Array<{ workSlug: string; title: string; releaseTitle: string }>;
    sameFilm: Array<{ workSlug: string; title: string }>;
    sameCreator: Array<{ workSlug: string; title: string; year: number | null }>;
  };
  sources: Source[];
}

export interface ResolvedCreditGroup {
  role: CreatorRole;
  entries: Array<{
    creatorId: EntityId;
    slug: string;
    name: string;
    detail?: string;
    sourceIds: EntityId[];
  }>;
}

export type SearchEntityType = 'creator' | 'work' | 'release' | 'film';

export interface SearchHit {
  id: EntityId;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  /** Route to the entity, or `null` when no detail page exists yet. */
  href: string | null;
  /** Year shown alongside the hit, when dated. */
  year: number | null;
  /** 0–1 relevance, for ordering only. */
  score: number;
  /** Matched substring range in `title`, for highlighting. */
  match?: { start: number; end: number };
}

export interface SearchResponse {
  query: string;
  total: number;
  groups: Array<{ type: SearchEntityType; label: string; hits: SearchHit[] }>;
}

export interface MusicOverview {
  totals: {
    works: number;
    recordings: number;
    releases: number;
    creators: number;
    films: number;
    sources: number;
  };
  span: { from: number; to: number };
  recent: TimelineEntry[];
  earliest: TimelineEntry[];
  featuredCreators: CreatorSummary[];
  histogram: YearBucket[];
  languages: Array<{ language: Language; count: number }>;
  byContext: Array<{ context: ProductionContext; count: number }>;
  byReleaseType: Array<{ type: ReleaseType; count: number }>;
}

/** Loading envelope used by the `useQuery` hook. */
export type QueryState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error };
