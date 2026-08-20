import type { Certainty, SourceType } from '../types/common';
import type { DurationBucket, DurationBucketDescriptor } from '../types/api';
import type {
  CreatorRole,
  Language,
  LanguageDescriptor,
  MusicType,
  ProductionContext,
  ReleaseClassification,
  ReleaseFormat,
  ReleaseType,
  WorkType,
} from '../types/music';

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const DURATION_BUCKETS: DurationBucketDescriptor[] = [
  { id: 'lt2', label: 'Under 2 min', minSeconds: 0, maxSeconds: 120 },
  { id: '2to4', label: '2–4 min', minSeconds: 120, maxSeconds: 240 },
  { id: '4to6', label: '4–6 min', minSeconds: 240, maxSeconds: 360 },
  { id: '6to10', label: '6–10 min', minSeconds: 360, maxSeconds: 600 },
  { id: 'gte10', label: '10 min and over', minSeconds: 600, maxSeconds: null },
];

export function bucketForDuration(seconds: number | null): DurationBucket | null {
  if (seconds === null) return null;
  const match = DURATION_BUCKETS.find(
    (bucket) =>
      seconds >= bucket.minSeconds &&
      (bucket.maxSeconds === null || seconds < bucket.maxSeconds),
  );
  return match ? match.id : null;
}

export const LANGUAGES: LanguageDescriptor[] = [
  { code: 'ta', label: 'Tamil', endonym: 'தமிழ்', available: true },
  { code: 'ml', label: 'Malayalam', endonym: 'മലയാളം', available: true },
  { code: 'en', label: 'English', available: true },
  { code: 'instrumental', label: 'No lyrics', available: true },
  { code: 'te', label: 'Telugu', endonym: 'తెలుగు', available: false },
  { code: 'kn', label: 'Kannada', endonym: 'ಕನ್ನಡ', available: false },
  { code: 'hi', label: 'Hindi', endonym: 'हिन्दी', available: false },
];

export const LANGUAGE_LABEL: Record<Language, string> = {
  ta: 'Tamil',
  ml: 'Malayalam',
  te: 'Telugu',
  kn: 'Kannada',
  hi: 'Hindi',
  en: 'English',
  instrumental: 'No lyrics',
};

export const ROLE_LABEL: Record<CreatorRole, string> = {
  composer: 'Composer',
  lyricist: 'Lyricist',
  vocalist: 'Vocalist',
  producer: 'Producer',
  arranger: 'Arranger',
  performer: 'Performer',
  conductor: 'Conductor',
  director: 'Director',
};

/** Roles offered as filters, in the order the filter panel lists them. */
export const FILTERABLE_ROLES: CreatorRole[] = [
  'composer',
  'lyricist',
  'vocalist',
  'producer',
  'arranger',
  'performer',
];

export const RELEASE_TYPE_LABEL: Record<ReleaseType, string> = {
  album: 'Album',
  single: 'Single',
  ep: 'EP',
  compilation: 'Compilation',
  soundtrack: 'Soundtrack',
  other: 'Other',
};

export const CLASSIFICATION_LABEL: Record<ReleaseClassification, string> = {
  commercial: 'Commercial',
  independent: 'Independent',
  'self-released': 'Self-released',
};

export const CONTEXT_LABEL: Record<ProductionContext, string> = {
  film: 'Film',
  'non-film': 'Non-film',
};

export const MUSIC_TYPE_LABEL: Record<MusicType, string> = {
  vocal: 'Vocal',
  instrumental: 'Instrumental',
  mixed: 'Mixed',
  'background-score': 'Background score',
};

export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  song: 'Song',
  'instrumental-piece': 'Instrumental piece',
  'score-cue': 'Score cue',
  medley: 'Medley',
};

export const FORMAT_LABEL: Record<ReleaseFormat, string> = {
  digital: 'Digital',
  cd: 'CD',
  cassette: 'Cassette',
  vinyl: 'Vinyl',
  other: 'Other',
};

export const CERTAINTY_LABEL: Record<Certainty, string> = {
  known: 'Known',
  'source-reported': 'Source reported',
  partial: 'Partial',
  disputed: 'Disputed',
  unknown: 'Unknown',
};

export const CERTAINTY_DESCRIPTION: Record<Certainty, string> = {
  known: 'Corroborated by two or more independent source records.',
  'source-reported': 'Asserted by a single source record and shown as reported, not established.',
  partial: 'Known only to a coarser granularity — the catalogue does not sharpen it.',
  disputed: 'Sources conflict. Every claim is retained rather than one being chosen.',
  unknown: 'No source in this dataset establishes this. Timeline does not fill the gap with a default.',
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  database: 'Database',
  label: 'Label',
  creator: 'Creator',
  streaming: 'Streaming platform',
  press: 'Press',
  archive: 'Archive',
  other: 'Other',
};

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat('en-GB').format(count);
}

/** Joins names as "A, B and C". */
export function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
