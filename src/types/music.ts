/**
 * The music domain model.
 *
 * The separation here matters and is deliberately not collapsed into a "song":
 *
 *   Work       the abstract composition (written once)
 *   Recording  a realisation of a Work (a specific take/version)
 *   Release    a published package containing Recordings
 *   Track      a Recording's position on a Release
 *
 * One Work can have many Recordings; one Recording can appear on many Releases.
 * The UI must be able to show a reissue or a compilation appearance without
 * treating it as a different piece of music.
 */

import type {
  ClockTime,
  DatePrecision,
  EntityId,
  Fact,
  PartialDate,
} from './common';

export type Language = 'ta' | 'hi' | 'te' | 'ml' | 'kn' | 'en' | 'instrumental';

export interface LanguageDescriptor {
  code: Language;
  label: string;
  endonym?: string;
  /** Whether this build carries catalogue data for the language. */
  available: boolean;
}

/** Roles a creator can be credited with. Extend as the catalogue grows. */
export type CreatorRole =
  | 'composer'
  | 'lyricist'
  | 'vocalist'
  | 'producer'
  | 'arranger'
  | 'performer'
  | 'conductor'
  | 'director';

/** A human being. Distinct from {@link Creator}: a person is not a credit. */
export interface Person {
  id: EntityId;
  slug: string;
  name: string;
  /** Filing name, e.g. "Rahman, A. R." */
  sortName: string;
  nameNative?: string;
  alternateNames: string[];
  bornOn: Fact<PartialDate>;
  diedOn?: Fact<PartialDate>;
  birthPlace?: Fact<string>;
  sourceIds: EntityId[];
}

export type CreatorKind = 'person' | 'group' | 'ensemble';

/**
 * A credited entity. Backed by a Person for solo creators, or standing on its
 * own for bands and ensembles.
 */
export interface Creator {
  id: EntityId;
  slug: string;
  kind: CreatorKind;
  personId?: EntityId;
  name: string;
  nameNative?: string;
  alternateNames: string[];
  roles: CreatorRole[];
  /** Primary working languages, most prominent first. */
  languages: Language[];
  activeFrom: Fact<PartialDate>;
  activeUntil: Fact<PartialDate>;
  summary: string;
  sourceIds: EntityId[];
}

export interface Label {
  id: EntityId;
  slug: string;
  name: string;
  foundedYear?: number;
  sourceIds: EntityId[];
}

export interface Film {
  id: EntityId;
  slug: string;
  title: string;
  titleNative?: string;
  language: Language;
  releaseYear: Fact<number>;
  directorPersonIds: EntityId[];
  /** The Release carrying this film's soundtrack, when catalogued. */
  soundtrackReleaseId?: EntityId;
  sourceIds: EntityId[];
}

export type WorkType = 'song' | 'instrumental-piece' | 'score-cue' | 'medley';

/** The composition itself, independent of any recording of it. */
export interface Work {
  id: EntityId;
  slug: string;
  title: string;
  titleNative?: string;
  type: WorkType;
  language: Language;
  /** Present when the work was written for a film. */
  filmId?: EntityId;
  /** When the composition was written, if a source establishes it. */
  writtenIn: Fact<PartialDate>;
  sourceIds: EntityId[];
}

export type MusicType = 'vocal' | 'instrumental' | 'mixed' | 'background-score';

/** A specific realisation of a {@link Work}. */
export interface Recording {
  id: EntityId;
  slug: string;
  workId: EntityId;
  /** Recording title, which can differ from the work title (version names). */
  title: string;
  titleNative?: string;
  /** e.g. "Original version", "Reprise", "Unplugged". */
  versionLabel?: string;
  musicType: MusicType;
  durationSeconds: Fact<number>;
  recordedIn: Fact<PartialDate>;
  sourceIds: EntityId[];
}

export type ReleaseType =
  | 'album'
  | 'single'
  | 'ep'
  | 'compilation'
  | 'soundtrack'
  | 'other';

/** Commercial standing of a release. */
export type ReleaseClassification = 'commercial' | 'independent' | 'self-released';

/** Whether the music was produced for a film or stands alone. */
export type ProductionContext = 'film' | 'non-film';

export type ReleaseFormat = 'digital' | 'cd' | 'cassette' | 'vinyl' | 'other';

/** A dated publication event for a Release, in one territory/format. */
export interface ReleaseEvent {
  id: EntityId;
  releaseId: EntityId;
  date: Fact<PartialDate>;
  datePrecision: DatePrecision;
  /**
   * Almost always `unknown`. Historic release times are not recorded, and this
   * build never invents one.
   */
  time: Fact<ClockTime>;
  territory: string;
  format: ReleaseFormat;
  sourceIds: EntityId[];
}

/** A published package of recordings. */
export interface Release {
  id: EntityId;
  slug: string;
  title: string;
  titleNative?: string;
  type: ReleaseType;
  classification: ReleaseClassification;
  context: ProductionContext;
  language: Language;
  labelId?: EntityId;
  filmId?: EntityId;
  /** Primary billed creators (usually the composer). */
  primaryCreatorIds: EntityId[];
  /** Ordered recording ids. */
  trackIds: EntityId[];
  /** Catalogue-level annotation, shown verbatim in the UI when present. */
  note?: string;
  sourceIds: EntityId[];
}

export type CreditSubjectType = 'work' | 'recording' | 'release';

/** A single credit: who did what, on which entity. */
export interface Credit {
  id: EntityId;
  subjectType: CreditSubjectType;
  subjectId: EntityId;
  creatorId: EntityId;
  role: CreatorRole;
  /** Free-text qualifier, e.g. "additional strings". */
  detail?: string;
  sourceIds: EntityId[];
}

/**
 * A denormalised row for chronological views. Assembled by the service layer
 * from the entities above — never authored directly, and never stored.
 */
export interface TimelineEntry {
  /** Stable key: the recording id plus the release it is dated by. */
  id: string;
  recordingId: EntityId;
  workId: EntityId;
  releaseId: EntityId;
  title: string;
  titleNative?: string;
  versionLabel?: string;
  /** Resolved date used for ordering; null when the date is unknown. */
  date: Fact<PartialDate>;
  datePrecision: DatePrecision;
  time: Fact<ClockTime>;
  /** Sort key derived from `date`; entries with no date sort last. */
  sortValue: number;
  year: number | null;
  durationSeconds: Fact<number>;
  musicType: MusicType;
  language: Language;
  releaseTitle: string;
  releaseType: ReleaseType;
  classification: ReleaseClassification;
  context: ProductionContext;
  filmTitle?: string;
  filmSlug?: string;
  workSlug: string;
  /** Every credit attached to the work, recording and release, de-duplicated. */
  credits: ResolvedCredit[];
  /** Every source id contributing to this row, de-duplicated. */
  sourceIds: EntityId[];
  /** True when this row is a later appearance of an earlier recording. */
  isSubsequentRelease: boolean;
}

export interface ResolvedCredit {
  creatorId: EntityId;
  creatorSlug: string;
  creatorName: string;
  role: CreatorRole;
  detail?: string;
}
