/**
 * The music service — the single boundary between the UI and the data.
 *
 * Every exported function is async and matches an entry in `endpoints.ts`.
 * Today they read the in-memory catalogue; in stage 2 their bodies become
 * `fetch` calls returning the same shapes. Components never touch `db`.
 */

import { db } from '../data/mock';
import {
  bucketForDuration,
  DURATION_BUCKETS,
  LANGUAGE_LABEL,
  RELEASE_TYPE_LABEL,
} from '../utils/format';
import { dateSortValue } from '../utils/date';
import type {
  EntityId,
  Fact,
  PartialDate,
  Relationship,
  Source,
} from '../types/common';
import type {
  Creator,
  CreatorRole,
  Film,
  Language,
  ProductionContext,
  Recording,
  Release,
  ReleaseEvent,
  ReleaseType,
  ResolvedCredit,
  TimelineEntry,
  Work,
} from '../types/music';
import type {
  CreatorDetail,
  CreatorSummary,
  MusicOverview,
  ResolvedCreditGroup,
  SearchEntityType,
  SearchHit,
  SearchResponse,
  TimelineQuery,
  TimelineResponse,
  WorkDetail,
  YearBucket,
} from '../types/api';

/** Simulated network latency, so loading states are exercised in development. */
const LATENCY_MS = 90;

function settle<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY_MS);
  });
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} was not found in the catalogue.`);
    this.name = 'NotFoundError';
  }
}

/* ------------------------------------------------------------------ *
 * Derivation: normalised entities → chronological entries
 * ------------------------------------------------------------------ */

function primaryEvent(releaseId: EntityId): ReleaseEvent | undefined {
  const events = db.eventsByRelease.get(releaseId) ?? [];
  if (events.length === 0) return undefined;
  const dated = events
    .filter((event) => event.date.value !== null)
    .sort((a, b) => dateSortValue(a.date.value) - dateSortValue(b.date.value));
  return dated[0] ?? events[0];
}

function resolveCredits(subjectIds: EntityId[]): ResolvedCredit[] {
  const seen = new Set<string>();
  const out: ResolvedCredit[] = [];
  for (const subjectId of subjectIds) {
    for (const credit of db.creditsBySubject.get(subjectId) ?? []) {
      const key = `${credit.creatorId}|${credit.role}|${credit.detail ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const creator = db.creatorById.get(credit.creatorId);
      if (!creator) continue;
      out.push({
        creatorId: creator.id,
        creatorSlug: creator.slug,
        creatorName: creator.name,
        role: credit.role,
        ...(credit.detail ? { detail: credit.detail } : {}),
      });
    }
  }
  return out;
}

function dedupeSourceIds(...groups: Array<EntityId[] | undefined>): EntityId[] {
  const seen = new Set<EntityId>();
  for (const group of groups) {
    for (const sourceId of group ?? []) seen.add(sourceId);
  }
  return [...seen];
}

/** Release id that first published each recording, by date. */
const firstReleaseByRecording = new Map<EntityId, EntityId>();
for (const [recordingId, releases] of db.releasesByRecording) {
  let best: { releaseId: EntityId; sort: number } | null = null;
  for (const release of releases) {
    const sort = dateSortValue(primaryEvent(release.id)?.date.value ?? null);
    if (!best || sort < best.sort) best = { releaseId: release.id, sort };
  }
  if (best) firstReleaseByRecording.set(recordingId, best.releaseId);
}

function buildEntry(
  release: Release,
  recording: Recording,
  work: Work,
  event: ReleaseEvent | undefined,
): TimelineEntry {
  const film = work.filmId
    ? db.filmById.get(work.filmId)
    : release.filmId
      ? db.filmById.get(release.filmId)
      : undefined;
  const date: Fact<PartialDate> = event
    ? event.date
    : { value: null, certainty: 'unknown', sourceIds: [] };

  return {
    id: `${release.id}::${recording.id}`,
    recordingId: recording.id,
    workId: work.id,
    releaseId: release.id,
    title: recording.title,
    ...(recording.titleNative ?? work.titleNative
      ? { titleNative: recording.titleNative ?? work.titleNative }
      : {}),
    ...(recording.versionLabel ? { versionLabel: recording.versionLabel } : {}),
    date,
    datePrecision: event?.datePrecision ?? 'year',
    time: event ? event.time : { value: null, certainty: 'unknown', sourceIds: [] },
    sortValue: dateSortValue(date.value),
    year: date.value ? date.value.year : null,
    durationSeconds: recording.durationSeconds,
    musicType: recording.musicType,
    language: work.language,
    releaseTitle: release.title,
    releaseType: release.type,
    classification: release.classification,
    context: release.context,
    ...(film ? { filmTitle: film.title, filmSlug: film.slug } : {}),
    workSlug: work.slug,
    credits: resolveCredits([work.id, recording.id, release.id]),
    sourceIds: dedupeSourceIds(
      work.sourceIds,
      recording.sourceIds,
      release.sourceIds,
      event?.sourceIds,
    ),
    isSubsequentRelease: firstReleaseByRecording.get(recording.id) !== release.id,
  };
}

/** Every (release × recording) pair, built once at module load. */
const allEntries: TimelineEntry[] = (() => {
  const entries: TimelineEntry[] = [];
  for (const release of db.releases) {
    const event = primaryEvent(release.id);
    for (const trackId of release.trackIds) {
      const recording = db.recordingById.get(trackId);
      if (!recording) continue;
      const work = db.workById.get(recording.workId);
      if (!work) continue;
      entries.push(buildEntry(release, recording, work, event));
    }
  }
  return entries.sort((a, b) => a.sortValue - b.sortValue);
})();

const catalogueSpan = (() => {
  const years = allEntries
    .map((entry) => entry.year)
    .filter((year): year is number => year !== null);
  return { from: Math.min(...years), to: Math.max(...years) };
})();

/* ------------------------------------------------------------------ *
 * Filtering
 * ------------------------------------------------------------------ */

function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function entryHaystack(entry: TimelineEntry): string {
  return normalise(
    [
      entry.title,
      entry.titleNative ?? '',
      entry.releaseTitle,
      entry.filmTitle ?? '',
      ...entry.credits.map((credit) => credit.creatorName),
    ].join(' '),
  );
}

function matchesQuery(entry: TimelineEntry, query: TimelineQuery): boolean {
  if (query.q && query.q.trim()) {
    if (!entryHaystack(entry).includes(normalise(query.q))) return false;
  }

  if (query.creatorId) {
    const credited = entry.credits.filter((credit) => credit.creatorId === query.creatorId);
    if (credited.length === 0) return false;
    if (query.creatorRole && !credited.some((credit) => credit.role === query.creatorRole)) {
      return false;
    }
    if (query.roles?.length && !credited.some((credit) => query.roles!.includes(credit.role))) {
      return false;
    }
  } else if (query.roles?.length) {
    if (!entry.credits.some((credit) => query.roles!.includes(credit.role))) return false;
  }

  if (query.languages?.length && !query.languages.includes(entry.language)) return false;
  if (query.releaseTypes?.length && !query.releaseTypes.includes(entry.releaseType)) return false;
  if (query.classifications?.length && !query.classifications.includes(entry.classification)) {
    return false;
  }
  if (query.contexts?.length && !query.contexts.includes(entry.context)) return false;
  if (query.musicTypes?.length && !query.musicTypes.includes(entry.musicType)) return false;

  if (query.durationBuckets?.length) {
    const bucket = bucketForDuration(entry.durationSeconds.value);
    if (!bucket || !query.durationBuckets.includes(bucket)) return false;
  }

  if (query.yearFrom !== undefined && (entry.year === null || entry.year < query.yearFrom)) {
    return false;
  }
  if (query.yearTo !== undefined && (entry.year === null || entry.year > query.yearTo)) {
    return false;
  }

  if (!query.includeSubsequentReleases && entry.isSubsequentRelease) return false;

  return true;
}

function histogramOf(entries: TimelineEntry[]): YearBucket[] {
  const counts = new Map<number, number>();
  for (const entry of entries) {
    if (entry.year === null) continue;
    counts.set(entry.year, (counts.get(entry.year) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
}

function applyQuery(query: TimelineQuery): TimelineEntry[] {
  const filtered = allEntries.filter((entry) => matchesQuery(entry, query));
  const dated = filtered.filter((entry) => entry.year !== null);
  const undated = filtered.filter((entry) => entry.year === null);
  dated.sort((a, b) =>
    query.sort === 'desc' ? b.sortValue - a.sortValue : a.sortValue - b.sortValue,
  );
  // Undated entries are never given a position in the chronology.
  return [...dated, ...undated];
}

/* ------------------------------------------------------------------ *
 * GET /api/music/timeline
 * ------------------------------------------------------------------ */

export async function getTimeline(query: TimelineQuery = {}): Promise<TimelineResponse> {
  const ordered = applyQuery(query);
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 60;
  return settle({
    items: ordered.slice(offset, offset + limit),
    total: ordered.length,
    offset,
    limit,
    histogram: histogramOf(ordered),
    span: catalogueSpan,
    undatedCount: ordered.filter((entry) => entry.year === null).length,
  });
}

/* ------------------------------------------------------------------ *
 * Creators
 * ------------------------------------------------------------------ */

function summariseCreator(creator: Creator): CreatorSummary {
  const entries = allEntries.filter(
    (entry) =>
      !entry.isSubsequentRelease &&
      entry.credits.some((credit) => credit.creatorId === creator.id),
  );
  const workIds = new Set(entries.map((entry) => entry.workId));
  const releaseIds = new Set(entries.map((entry) => entry.releaseId));
  const filmSlugs = new Set(
    entries.map((entry) => entry.filmSlug).filter((slug): slug is string => Boolean(slug)),
  );
  const years = entries
    .map((entry) => entry.year)
    .filter((year): year is number => year !== null);

  const roleCounts = new Map<CreatorRole, number>();
  for (const entry of entries) {
    for (const credit of entry.credits) {
      if (credit.creatorId !== creator.id) continue;
      roleCounts.set(credit.role, (roleCounts.get(credit.role) ?? 0) + 1);
    }
  }

  const person = creator.personId ? db.personById.get(creator.personId) : undefined;

  return {
    creator,
    ...(person ? { person } : {}),
    workCount: workIds.size,
    releaseCount: releaseIds.size,
    filmCount: filmSlugs.size,
    activeSpan: {
      from: years.length ? Math.min(...years) : null,
      to: years.length ? Math.max(...years) : null,
    },
    topRoles: [...roleCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([role]) => role),
    histogram: histogramOf(entries),
  };
}

export interface CreatorListQuery {
  q?: string;
  role?: CreatorRole;
  limit?: number;
}

export async function listCreators(
  query: CreatorListQuery = {},
): Promise<{ items: CreatorSummary[]; total: number }> {
  let summaries = db.creators.map(summariseCreator);

  if (query.role) {
    summaries = summaries.filter((summary) => summary.topRoles.includes(query.role!));
  }
  if (query.q?.trim()) {
    const needle = normalise(query.q);
    summaries = summaries.filter((summary) =>
      [summary.creator.name, ...summary.creator.alternateNames]
        .map(normalise)
        .some((candidate) => candidate.includes(needle)),
    );
  }

  summaries.sort(
    (a, b) => b.workCount - a.workCount || a.creator.name.localeCompare(b.creator.name),
  );
  const total = summaries.length;
  return settle({
    items: query.limit ? summaries.slice(0, query.limit) : summaries,
    total,
  });
}

export async function getCreator(slug: string): Promise<CreatorDetail> {
  const creator = db.creatorBySlug.get(slug);
  if (!creator) throw new NotFoundError(`Creator "${slug}"`);
  const summary = summariseCreator(creator);

  const entries = allEntries.filter(
    (entry) =>
      !entry.isSubsequentRelease &&
      entry.credits.some((credit) => credit.creatorId === creator.id),
  );

  const collabCounts = new Map<string, { creatorId: EntityId; role: CreatorRole; count: number }>();
  for (const entry of entries) {
    for (const credit of entry.credits) {
      if (credit.creatorId === creator.id) continue;
      const key = `${credit.creatorId}|${credit.role}`;
      const existing = collabCounts.get(key);
      if (existing) existing.count += 1;
      else collabCounts.set(key, { creatorId: credit.creatorId, role: credit.role, count: 1 });
    }
  }

  const collaborators = [...collabCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((entry) => {
      const other = db.creatorById.get(entry.creatorId)!;
      return {
        creatorId: other.id,
        slug: other.slug,
        name: other.name,
        role: entry.role,
        count: entry.count,
      };
    });

  const films: Film[] = [
    ...new Set(
      entries.map((entry) => entry.filmSlug).filter((slug): slug is string => Boolean(slug)),
    ),
  ]
    .map((slug) => db.filmBySlug.get(slug)!)
    .sort((a, b) => (a.releaseYear.value ?? 0) - (b.releaseYear.value ?? 0));

  const sourceIds = dedupeSourceIds(
    creator.sourceIds,
    summary.person?.sourceIds,
    ...entries.map((entry) => entry.sourceIds),
  );

  return settle({
    ...summary,
    collaborators,
    films,
    sources: sourceIds
      .map((sourceId) => db.sourceById.get(sourceId))
      .filter((source): source is Source => Boolean(source)),
  });
}

/* ------------------------------------------------------------------ *
 * Works
 * ------------------------------------------------------------------ */

function groupCredits(subjectIds: EntityId[]): ResolvedCreditGroup[] {
  const byRole = new Map<CreatorRole, ResolvedCreditGroup['entries']>();
  for (const subjectId of subjectIds) {
    for (const credit of db.creditsBySubject.get(subjectId) ?? []) {
      const creator = db.creatorById.get(credit.creatorId);
      if (!creator) continue;
      const bucket = byRole.get(credit.role) ?? [];
      if (bucket.some((entry) => entry.creatorId === creator.id && entry.detail === credit.detail)) {
        continue;
      }
      bucket.push({
        creatorId: creator.id,
        slug: creator.slug,
        name: creator.name,
        ...(credit.detail ? { detail: credit.detail } : {}),
        sourceIds: credit.sourceIds,
      });
      byRole.set(credit.role, bucket);
    }
  }
  return [...byRole.entries()].map(([role, entries]) => ({ role, entries }));
}

export async function getWork(slug: string): Promise<WorkDetail> {
  const work = db.workBySlug.get(slug);
  if (!work) throw new NotFoundError(`Work "${slug}"`);

  const recordings = (db.recordingsByWork.get(work.id) ?? []).slice();
  const recordingDetails = recordings.map((recording) => {
    const releases = db.releasesByRecording.get(recording.id) ?? [];
    const appearances = releases
      .map((release) => {
        const event = primaryEvent(release.id);
        const label = release.labelId ? db.labelById.get(release.labelId) : undefined;
        return {
          release,
          ...(event ? { event } : {}),
          ...(label ? { label } : {}),
          trackNumber: release.trackIds.indexOf(recording.id) + 1,
        };
      })
      .sort(
        (a, b) =>
          dateSortValue(a.event?.date.value ?? null) - dateSortValue(b.event?.date.value ?? null),
      );
    return { recording, appearances };
  });

  recordingDetails.sort((a, b) => {
    const aDate = a.appearances[0]?.event?.date.value ?? null;
    const bDate = b.appearances[0]?.event?.date.value ?? null;
    return dateSortValue(aDate) - dateSortValue(bDate);
  });

  const releaseIds = [
    ...new Set(
      recordingDetails.flatMap((detail) =>
        detail.appearances.map((appearance) => appearance.release.id),
      ),
    ),
  ];

  const relatedWorks = db.relationships
    .filter((relationship) => relationship.fromId === work.id || relationship.toId === work.id)
    .map((relationship: Relationship) => {
      const outgoing = relationship.fromId === work.id;
      const otherId = outgoing ? relationship.toId : relationship.fromId;
      const other = db.workById.get(otherId);
      return other
        ? {
            relationship,
            work: other,
            direction: (outgoing ? 'outgoing' : 'incoming') as 'outgoing' | 'incoming',
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Structural neighbours — derived, not asserted by a relationship record.
  const sameRelease: WorkDetail['related']['sameRelease'] = [];
  for (const releaseId of releaseIds) {
    const release = db.releaseById.get(releaseId);
    if (!release) continue;
    for (const trackId of release.trackIds) {
      const recording = db.recordingById.get(trackId);
      if (!recording || recording.workId === work.id) continue;
      const sibling = db.workById.get(recording.workId);
      if (!sibling) continue;
      if (sameRelease.some((item) => item.workSlug === sibling.slug)) continue;
      sameRelease.push({
        workSlug: sibling.slug,
        title: sibling.title,
        releaseTitle: release.title,
      });
    }
  }

  const film = work.filmId ? db.filmById.get(work.filmId) : undefined;
  const sameFilm = film
    ? db.works
        .filter((candidate) => candidate.filmId === film.id && candidate.id !== work.id)
        .map((candidate) => ({ workSlug: candidate.slug, title: candidate.title }))
    : [];

  const composerIds = new Set(
    (db.creditsBySubject.get(work.id) ?? [])
      .filter((credit) => credit.role === 'composer')
      .map((credit) => credit.creatorId),
  );
  const sameCreator = allEntries
    .filter(
      (entry) =>
        !entry.isSubsequentRelease &&
        entry.workId !== work.id &&
        entry.credits.some(
          (credit) => credit.role === 'composer' && composerIds.has(credit.creatorId),
        ),
    )
    .slice(0, 8)
    .map((entry) => ({ workSlug: entry.workSlug, title: entry.title, year: entry.year }));

  const sourceIds = dedupeSourceIds(
    work.sourceIds,
    ...recordings.map((recording) => recording.sourceIds),
    ...releaseIds.map((releaseId) => db.releaseById.get(releaseId)?.sourceIds),
    ...releaseIds.flatMap((releaseId) =>
      (db.eventsByRelease.get(releaseId) ?? []).map((event) => event.sourceIds),
    ),
  );

  return settle({
    work,
    ...(film ? { film } : {}),
    recordings: recordingDetails,
    credits: {
      work: groupCredits([work.id]),
      recording: groupCredits(recordings.map((recording) => recording.id)),
      release: groupCredits(releaseIds),
    },
    relatedWorks,
    related: { sameRelease: sameRelease.slice(0, 10), sameFilm, sameCreator },
    sources: sourceIds
      .map((sourceId) => db.sourceById.get(sourceId))
      .filter((source): source is Source => Boolean(source)),
  });
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

function scoreCandidate(candidate: string, needle: string): number {
  const haystack = normalise(candidate);
  if (!haystack.includes(needle)) return 0;
  if (haystack === needle) return 1;
  if (haystack.startsWith(needle)) return 0.9;
  if (new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(haystack)) return 0.75;
  return 0.5;
}

function matchRange(title: string, needle: string): { start: number; end: number } | undefined {
  const index = normalise(title).indexOf(needle);
  return index === -1 ? undefined : { start: index, end: index + needle.length };
}

const GROUP_LABEL: Record<SearchEntityType, string> = {
  creator: 'Creators',
  work: 'Works',
  release: 'Albums & releases',
  film: 'Films',
};

export async function search(rawQuery: string): Promise<SearchResponse> {
  const needle = normalise(rawQuery);
  if (needle.length < 2) {
    return settle({ query: rawQuery, total: 0, groups: [] });
  }

  const hits: SearchHit[] = [];

  for (const creator of db.creators) {
    const score = Math.max(
      ...[creator.name, creator.nameNative ?? '', ...creator.alternateNames].map((candidate) =>
        scoreCandidate(candidate, needle),
      ),
    );
    if (score === 0) continue;
    const summary = summariseCreator(creator);
    const roles = creator.roles.slice(0, 2).join(', ');
    hits.push({
      id: creator.id,
      type: 'creator',
      title: creator.name,
      subtitle: `${roles} · ${summary.workCount} catalogued ${summary.workCount === 1 ? 'work' : 'works'}`,
      href: `/music/creator/${creator.slug}`,
      year: summary.activeSpan.from,
      score,
      ...(matchRange(creator.name, needle) ? { match: matchRange(creator.name, needle) } : {}),
    });
  }

  for (const work of db.works) {
    const score = Math.max(
      scoreCandidate(work.title, needle),
      work.titleNative ? scoreCandidate(work.titleNative, needle) : 0,
    );
    if (score === 0) continue;
    const entry = allEntries.find((candidate) => candidate.workId === work.id);
    const composers = (db.creditsBySubject.get(work.id) ?? [])
      .filter((credit) => credit.role === 'composer')
      .map((credit) => db.creatorById.get(credit.creatorId)?.name)
      .filter(Boolean);
    hits.push({
      id: work.id,
      type: 'work',
      title: work.title,
      subtitle: [composers.join(', '), entry?.filmTitle ?? entry?.releaseTitle]
        .filter(Boolean)
        .join(' · '),
      href: `/music/work/${work.slug}`,
      year: entry?.year ?? null,
      score,
      ...(matchRange(work.title, needle) ? { match: matchRange(work.title, needle) } : {}),
    });
  }

  for (const release of db.releases) {
    const score = scoreCandidate(release.title, needle);
    if (score === 0) continue;
    const event = primaryEvent(release.id);
    const creatorNames = release.primaryCreatorIds
      .map((creatorId) => db.creatorById.get(creatorId)?.name)
      .filter(Boolean);
    hits.push({
      id: release.id,
      type: 'release',
      title: release.title,
      subtitle: `${RELEASE_TYPE_LABEL[release.type]} · ${creatorNames.join(', ')}`,
      href: `/music/timeline?q=${encodeURIComponent(release.title)}&subsequent=1`,
      year: event?.date.value?.year ?? null,
      score,
      ...(matchRange(release.title, needle) ? { match: matchRange(release.title, needle) } : {}),
    });
  }

  for (const film of db.films) {
    const score = Math.max(
      scoreCandidate(film.title, needle),
      film.titleNative ? scoreCandidate(film.titleNative, needle) : 0,
    );
    if (score === 0) continue;
    hits.push({
      id: film.id,
      type: 'film',
      title: film.title,
      subtitle: `Film · ${film.releaseYear.value ?? 'year unknown'}`,
      href: `/music/timeline?q=${encodeURIComponent(film.title)}`,
      year: film.releaseYear.value,
      score,
      ...(matchRange(film.title, needle) ? { match: matchRange(film.title, needle) } : {}),
    });
  }

  const order: SearchEntityType[] = ['creator', 'work', 'release', 'film'];
  const groups = order
    .map((type) => ({
      type,
      label: GROUP_LABEL[type],
      hits: hits
        .filter((hit) => hit.type === type)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
        .slice(0, 6),
    }))
    .filter((group) => group.hits.length > 0);

  return settle({ query: rawQuery, total: hits.length, groups });
}

/* ------------------------------------------------------------------ *
 * Overview
 * ------------------------------------------------------------------ */

export async function getMusicOverview(): Promise<MusicOverview> {
  const firstAppearances = allEntries.filter((entry) => !entry.isSubsequentRelease);
  const dated = firstAppearances.filter((entry) => entry.year !== null);

  const countBy = <T extends string>(pick: (entry: TimelineEntry) => T) => {
    const counts = new Map<T, number>();
    for (const entry of firstAppearances) {
      const key = pick(entry);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const featured = db.creators
    .map(summariseCreator)
    .filter((summary) => summary.creator.roles.includes('composer'))
    .sort((a, b) => b.workCount - a.workCount)
    .slice(0, 6);

  return settle({
    totals: {
      works: db.works.length,
      recordings: db.recordings.length,
      releases: db.releases.length,
      creators: db.creators.length,
      films: db.films.length,
      sources: db.sources.length,
    },
    span: catalogueSpan,
    recent: [...dated].sort((a, b) => b.sortValue - a.sortValue).slice(0, 6),
    earliest: [...dated].sort((a, b) => a.sortValue - b.sortValue).slice(0, 4),
    featuredCreators: featured,
    histogram: histogramOf(firstAppearances),
    languages: countBy<Language>((entry) => entry.language).map(([language, count]) => ({
      language,
      count,
    })),
    byContext: countBy<ProductionContext>((entry) => entry.context).map(([context, count]) => ({
      context,
      count,
    })),
    byReleaseType: countBy<ReleaseType>((entry) => entry.releaseType).map(([type, count]) => ({
      type,
      count,
    })),
  });
}

/* ------------------------------------------------------------------ *
 * Filter facets — the option lists the filter UI renders
 * ------------------------------------------------------------------ */

export interface FacetCounts {
  releaseTypes: Array<{ value: ReleaseType; count: number }>;
  languages: Array<{ value: Language; label: string; count: number }>;
  span: { from: number; to: number };
  durationBuckets: typeof DURATION_BUCKETS;
}

export async function getFacets(): Promise<FacetCounts> {
  const first = allEntries.filter((entry) => !entry.isSubsequentRelease);
  const count = <T>(pick: (entry: TimelineEntry) => T) => {
    const counts = new Map<T, number>();
    for (const entry of first) counts.set(pick(entry), (counts.get(pick(entry)) ?? 0) + 1);
    return counts;
  };
  const typeCounts = count<ReleaseType>((entry) => entry.releaseType);
  const languageCounts = count<Language>((entry) => entry.language);

  return settle({
    releaseTypes: (Object.keys(RELEASE_TYPE_LABEL) as ReleaseType[]).map((value) => ({
      value,
      count: typeCounts.get(value) ?? 0,
    })),
    languages: [...languageCounts.entries()].map(([value, count]) => ({
      value,
      label: LANGUAGE_LABEL[value],
      count,
    })),
    span: catalogueSpan,
    durationBuckets: DURATION_BUCKETS,
  });
}

/** Total number of chronological entries, used by the home page counter. */
export const catalogueSize = allEntries.length;
