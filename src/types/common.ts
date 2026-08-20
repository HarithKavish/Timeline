/**
 * Cross-domain primitives.
 *
 * Timeline is a chronological catalogue of creative works. Music is the first
 * domain, but nothing in this file may assume music: the same primitives are
 * intended to carry films, games, books, software and technology later.
 */

/** Every entity is addressed by a stable, opaque id: `<type>:<slug>`. */
export type EntityId = string;

export type Domain =
  | 'music'
  | 'film'
  | 'games'
  | 'books'
  | 'software'
  | 'technology';

export type DomainStatus = 'available' | 'planned';

export interface DomainDescriptor {
  id: Domain;
  label: string;
  /** One-line description of what the domain catalogues. */
  blurb: string;
  status: DomainStatus;
  /** Route prefix for the domain, e.g. `/music`. */
  path: string;
  /** Number of catalogued entities, when the domain is available. */
  entityCount?: number;
}

/**
 * How well a single fact is established.
 *
 * Timeline never converts absence into a value. A missing release time is
 * `unknown`, not midnight; a year-only date is `partial`, not January 1st.
 */
export type Certainty =
  /** Corroborated by two or more independent sources. */
  | 'known'
  /** A single source asserts it; recorded, attributed, not corroborated. */
  | 'source-reported'
  /** Known to a coarser granularity than requested (year, month). */
  | 'partial'
  /** Sources conflict; all claims are retained. */
  | 'disputed'
  /** No source establishes it. */
  | 'unknown';

/**
 * A single fact plus its provenance. This is the unit the eventual ingestion
 * pipeline will write: facts are attributed individually, not per-record.
 */
export interface Fact<T> {
  value: T | null;
  certainty: Certainty;
  /** Ids of the {@link Source} records supporting this specific fact. */
  sourceIds: EntityId[];
  /** Competing claims, retained verbatim when `certainty` is `disputed`. */
  alternatives?: Array<{ value: T; sourceIds: EntityId[] }>;
  note?: string;
}

/** A date known to year, month or day granularity. */
export interface PartialDate {
  year: number;
  month?: number;
  day?: number;
}

export type DatePrecision = 'year' | 'month' | 'day';

/** Local wall-clock time, 24h. Only ever present when a source states it. */
export interface ClockTime {
  hour: number;
  minute: number;
  /** IANA zone or a short label, when the source states one. */
  zone?: string;
}

export type SourceType =
  | 'database'
  | 'label'
  | 'creator'
  | 'streaming'
  | 'press'
  | 'archive'
  | 'other';

export type SourceStatus = 'verified' | 'unverified' | 'mock';

export type SourceConfidence = 'high' | 'medium' | 'low';

/**
 * A provenance record. In this build every source is `status: 'mock'` — the
 * shape is real, the records are demonstration data.
 */
export interface Source {
  id: EntityId;
  name: string;
  type: SourceType;
  /**
   * Placeholder locator. Deliberately not a real URL: this build must not
   * imply citations that were never retrieved.
   */
  urlPlaceholder: string;
  /** Which fields this source is being relied on for. */
  supports: string[];
  confidence: SourceConfidence;
  status: SourceStatus;
  /** ISO date the record was captured, when applicable. */
  retrievedAt?: string;
  note?: string;
}

export type RelationshipType =
  | 'cover-of'
  | 'remix-of'
  | 'reuses'
  | 'sampled-in'
  | 'reissue-of'
  | 'companion-to'
  | 'same-session';

/** A typed edge between any two entities, in either direction. */
export interface Relationship {
  id: EntityId;
  type: RelationshipType;
  fromId: EntityId;
  toId: EntityId;
  note?: string;
  sourceIds: EntityId[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
