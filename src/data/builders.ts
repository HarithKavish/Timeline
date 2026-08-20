/**
 * Authoring helpers for the mock catalogue.
 *
 * The stored shape is fully normalised (Work / Recording / Release /
 * ReleaseEvent / Credit). These builders keep the *authoring* shape compact so
 * the data files stay readable, then expand it into the real entities. When a
 * backend replaces the mock layer, only the data files and this file go away —
 * the entity shapes stay exactly as they are.
 */

import type {
  Certainty,
  ClockTime,
  DatePrecision,
  EntityId,
  Fact,
  PartialDate,
} from '../types/common';
import type {
  Credit,
  CreatorRole,
  Language,
  MusicType,
  ProductionContext,
  Recording,
  Release,
  ReleaseClassification,
  ReleaseEvent,
  ReleaseFormat,
  ReleaseType,
  Work,
  WorkType,
} from '../types/music';

export type DateTuple = [year: number, month?: number, day?: number];

export const id = {
  person: (slug: string): EntityId => `person:${slug}`,
  creator: (slug: string): EntityId => `creator:${slug}`,
  work: (slug: string): EntityId => `work:${slug}`,
  recording: (slug: string): EntityId => `rec:${slug}`,
  release: (slug: string): EntityId => `release:${slug}`,
  film: (slug: string): EntityId => `film:${slug}`,
  label: (slug: string): EntityId => `label:${slug}`,
  source: (slug: string): EntityId => `src:${slug}`,
};

export const srcIds = (slugs: string[]): EntityId[] => slugs.map(id.source);

export function fact<T>(
  value: T | null,
  certainty: Certainty,
  sources: string[] = [],
  note?: string,
): Fact<T> {
  return { value, certainty, sourceIds: srcIds(sources), ...(note ? { note } : {}) };
}

/** No source establishes this fact. Never rendered as a default value. */
export function unknown<T>(note?: string): Fact<T> {
  return { value: null, certainty: 'unknown', sourceIds: [], ...(note ? { note } : {}) };
}

export function dateFact(
  date: DateTuple | null,
  certainty: Certainty,
  sources: string[] = [],
  note?: string,
): Fact<PartialDate> {
  if (!date) return unknown<PartialDate>(note);
  const [year, month, day] = date;
  const value: PartialDate = { year };
  if (month !== undefined) value.month = month;
  if (day !== undefined) value.day = day;
  return fact(value, certainty, sources, note);
}

export interface EventSpec {
  date: DateTuple | null;
  precision: DatePrecision;
  /** Defaults to `source-reported` — a single mock source asserts the date. */
  certainty?: Certainty;
  /**
   * Only set when a source record states a time. Historic releases have none,
   * and this build does not invent one.
   */
  time?: ClockTime;
  timeCertainty?: Certainty;
  timeSources?: string[];
  timeNote?: string;
  territory?: string;
  format?: ReleaseFormat;
  sources: string[];
  dateNote?: string;
}

export interface TrackSpec {
  slug: string;
  title: string;
  titleNative?: string;
  musicType: MusicType;
  /** Seconds. Omit entirely when no source states a duration. */
  duration?: number;
  durationCertainty?: Certainty;
  durationSources?: string[];
  workType?: WorkType;
  language?: Language;
  versionLabel?: string;
  /** Creator slugs. Falls back to the release's primary creators. */
  composers?: string[];
  lyricists?: string[];
  vocalists?: string[];
  /** Extra credits: [creatorSlug, role, detail?]. */
  extraCredits?: Array<[string, CreatorRole, string?]>;
  sources?: string[];
  writtenIn?: DateTuple;
  /**
   * This release carries a recording defined on another release (compilation
   * appearance, reissue). No new Work or Recording is created.
   */
  sameRecordingAs?: string;
  /** A new recording of a Work defined elsewhere (re-recording, reprise). */
  sameWorkAs?: string;
}

export interface ReleaseSpec {
  slug: string;
  title: string;
  titleNative?: string;
  type: ReleaseType;
  classification: ReleaseClassification;
  context: ProductionContext;
  language: Language;
  label?: string;
  film?: string;
  /** Creator slugs billed on the release (usually the composer). */
  primaryCreators: string[];
  /** Catalogue-level annotation, surfaced verbatim in the UI. */
  note?: string;
  events: EventSpec[];
  /** Release-level credits: [creatorSlug, role, detail?]. */
  credits?: Array<[string, CreatorRole, string?]>;
  sources: string[];
  tracks: TrackSpec[];
}

export interface CatalogueBundle {
  works: Work[];
  recordings: Recording[];
  releases: Release[];
  events: ReleaseEvent[];
  credits: Credit[];
}

let creditCounter = 0;
const nextCreditId = (): EntityId => `credit:${(creditCounter += 1)}`;

function credit(
  subjectType: Credit['subjectType'],
  subjectId: EntityId,
  creatorSlug: string,
  role: CreatorRole,
  sources: string[],
  detail?: string,
): Credit {
  return {
    id: nextCreditId(),
    subjectType,
    subjectId,
    creatorId: id.creator(creatorSlug),
    role,
    ...(detail ? { detail } : {}),
    sourceIds: srcIds(sources),
  };
}

/** Expands compact release specs into normalised catalogue entities. */
export function buildCatalogue(specs: ReleaseSpec[]): CatalogueBundle {
  const works: Work[] = [];
  const recordings: Recording[] = [];
  const releases: Release[] = [];
  const events: ReleaseEvent[] = [];
  const credits: Credit[] = [];
  const seenWorks = new Set<string>();
  const seenRecordings = new Set<string>();

  for (const spec of specs) {
    const releaseId = id.release(spec.slug);
    const trackIds: EntityId[] = [];

    for (const track of spec.tracks) {
      const trackSources = track.sources ?? spec.sources;

      if (track.sameRecordingAs) {
        // A previously-defined recording appearing on another release.
        trackIds.push(id.recording(track.sameRecordingAs));
        continue;
      }

      const workSlug = track.sameWorkAs ?? track.slug;
      const workId = id.work(workSlug);

      if (!seenWorks.has(workSlug)) {
        seenWorks.add(workSlug);
        works.push({
          id: workId,
          slug: workSlug,
          title: track.title,
          ...(track.titleNative ? { titleNative: track.titleNative } : {}),
          type: track.workType ?? 'song',
          language: track.language ?? spec.language,
          ...(spec.film ? { filmId: id.film(spec.film) } : {}),
          writtenIn: track.writtenIn
            ? dateFact(track.writtenIn, 'source-reported', trackSources)
            : unknown<PartialDate>(
                'No source in this dataset states a composition date.',
              ),
          sourceIds: srcIds(trackSources),
        });

        const composers = track.composers ?? spec.primaryCreators;
        for (const composer of composers) {
          credits.push(credit('work', workId, composer, 'composer', trackSources));
        }
        for (const lyricist of track.lyricists ?? []) {
          credits.push(credit('work', workId, lyricist, 'lyricist', trackSources));
        }
      }

      if (seenRecordings.has(track.slug)) {
        throw new Error(`Duplicate recording slug: ${track.slug}`);
      }
      seenRecordings.add(track.slug);

      const recordingId = id.recording(track.slug);
      recordings.push({
        id: recordingId,
        slug: track.slug,
        workId,
        title: track.title,
        ...(track.titleNative ? { titleNative: track.titleNative } : {}),
        ...(track.versionLabel ? { versionLabel: track.versionLabel } : {}),
        musicType: track.musicType,
        durationSeconds:
          track.duration === undefined
            ? unknown<number>('No source in this dataset states a duration.')
            : fact(
                track.duration,
                track.durationCertainty ?? 'source-reported',
                track.durationSources ?? trackSources,
              ),
        recordedIn: unknown<PartialDate>(
          'Session dates are not carried by the sources in this dataset.',
        ),
        sourceIds: srcIds(trackSources),
      });

      for (const vocalist of track.vocalists ?? []) {
        credits.push(credit('recording', recordingId, vocalist, 'vocalist', trackSources));
      }
      for (const [slug, role, detail] of track.extraCredits ?? []) {
        credits.push(credit('recording', recordingId, slug, role, trackSources, detail));
      }

      trackIds.push(recordingId);
    }

    releases.push({
      id: releaseId,
      slug: spec.slug,
      title: spec.title,
      ...(spec.titleNative ? { titleNative: spec.titleNative } : {}),
      type: spec.type,
      classification: spec.classification,
      context: spec.context,
      language: spec.language,
      ...(spec.label ? { labelId: id.label(spec.label) } : {}),
      ...(spec.film ? { filmId: id.film(spec.film) } : {}),
      primaryCreatorIds: spec.primaryCreators.map(id.creator),
      trackIds,
      ...(spec.note ? { note: spec.note } : {}),
      sourceIds: srcIds(spec.sources),
    });

    for (const primary of spec.primaryCreators) {
      credits.push(credit('release', releaseId, primary, 'composer', spec.sources));
    }
    for (const [slug, role, detail] of spec.credits ?? []) {
      credits.push(credit('release', releaseId, slug, role, spec.sources, detail));
    }

    spec.events.forEach((event, index) => {
      events.push({
        id: `event:${spec.slug}-${index + 1}`,
        releaseId,
        date: dateFact(
          event.date,
          event.certainty ?? 'source-reported',
          event.sources,
          event.dateNote,
        ),
        datePrecision: event.precision,
        time: event.time
          ? fact(
              event.time,
              event.timeCertainty ?? 'source-reported',
              event.timeSources ?? event.sources,
              event.timeNote,
            )
          : unknown<ClockTime>(
              'No source in this dataset states a release time. Timeline does not infer one.',
            ),
        territory: event.territory ?? 'IN',
        format: event.format ?? 'digital',
        sourceIds: srcIds(event.sources),
      });
    });
  }

  return { works, recordings, releases, events, credits };
}
