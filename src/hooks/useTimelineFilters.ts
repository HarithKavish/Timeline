import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CLASSIFICATION_LABEL,
  CONTEXT_LABEL,
  DURATION_BUCKETS,
  LANGUAGE_LABEL,
  MUSIC_TYPE_LABEL,
  RELEASE_TYPE_LABEL,
  ROLE_LABEL,
} from '../utils/format';
import type { DurationBucket, SortDirection, TimelineQuery } from '../types/api';
import type {
  CreatorRole,
  Language,
  MusicType,
  ProductionContext,
  ReleaseClassification,
  ReleaseType,
} from '../types/music';

/**
 * Filter state lives in the URL, not in component state.
 *
 * That gives shareable, back-button-able discovery for free, and — because the
 * same query string is what `GET /api/music/timeline` will accept — the client
 * and the future API already speak the same language.
 */
export interface FilterState {
  q: string;
  roles: CreatorRole[];
  languages: Language[];
  releaseTypes: ReleaseType[];
  classifications: ReleaseClassification[];
  contexts: ProductionContext[];
  musicTypes: MusicType[];
  durationBuckets: DurationBucket[];
  yearFrom: number | null;
  yearTo: number | null;
  sort: SortDirection;
  includeSubsequentReleases: boolean;
}

export type MultiFilterKey =
  | 'roles'
  | 'languages'
  | 'releaseTypes'
  | 'classifications'
  | 'contexts'
  | 'musicTypes'
  | 'durationBuckets';

const PARAM: Record<MultiFilterKey, string> = {
  roles: 'role',
  languages: 'lang',
  releaseTypes: 'type',
  classifications: 'class',
  contexts: 'ctx',
  musicTypes: 'music',
  durationBuckets: 'dur',
};

const GROUP_LABEL: Record<MultiFilterKey, string> = {
  roles: 'Role',
  languages: 'Language',
  releaseTypes: 'Release type',
  classifications: 'Classification',
  contexts: 'Context',
  musicTypes: 'Music type',
  durationBuckets: 'Duration',
};

const DURATION_LABEL: Record<DurationBucket, string> = Object.fromEntries(
  DURATION_BUCKETS.map((bucket) => [bucket.id, bucket.label]),
) as Record<DurationBucket, string>;

function valueLabel(key: MultiFilterKey, value: string): string {
  switch (key) {
    case 'roles':
      return ROLE_LABEL[value as CreatorRole] ?? value;
    case 'languages':
      return LANGUAGE_LABEL[value as Language] ?? value;
    case 'releaseTypes':
      return RELEASE_TYPE_LABEL[value as ReleaseType] ?? value;
    case 'classifications':
      return CLASSIFICATION_LABEL[value as ReleaseClassification] ?? value;
    case 'contexts':
      return CONTEXT_LABEL[value as ProductionContext] ?? value;
    case 'musicTypes':
      return MUSIC_TYPE_LABEL[value as MusicType] ?? value;
    case 'durationBuckets':
      return DURATION_LABEL[value as DurationBucket] ?? value;
    default:
      return value;
  }
}

export interface ActiveFilter {
  id: string;
  group: string;
  label: string;
  remove: () => void;
}

export interface FilterController {
  state: FilterState;
  query: TimelineQuery;
  activeFilters: ActiveFilter[];
  activeCount: number;
  isActive: (key: MultiFilterKey, value: string) => boolean;
  toggle: (key: MultiFilterKey, value: string) => void;
  setQ: (value: string) => void;
  setYearRange: (from: number | null, to: number | null) => void;
  setSort: (sort: SortDirection) => void;
  setIncludeSubsequent: (include: boolean) => void;
  clearGroup: (key: MultiFilterKey) => void;
  clearAll: () => void;
}

function parseYear(value: string | null): number | null {
  if (!value) return null;
  const year = Number.parseInt(value, 10);
  return Number.isFinite(year) ? year : null;
}

/**
 * @param base extra query fields applied on every request (e.g. a creator id
 *             when the timeline is scoped to a creator page).
 */
export function useTimelineFilters(base: Partial<TimelineQuery> = {}): FilterController {
  const [searchParams, setSearchParams] = useSearchParams();

  const readMulti = useCallback(
    (key: MultiFilterKey): string[] => {
      const raw = searchParams.get(PARAM[key]);
      return raw ? raw.split(',').filter(Boolean) : [];
    },
    [searchParams],
  );

  const state = useMemo<FilterState>(
    () => ({
      q: searchParams.get('q') ?? '',
      roles: readMulti('roles') as CreatorRole[],
      languages: readMulti('languages') as Language[],
      releaseTypes: readMulti('releaseTypes') as ReleaseType[],
      classifications: readMulti('classifications') as ReleaseClassification[],
      contexts: readMulti('contexts') as ProductionContext[],
      musicTypes: readMulti('musicTypes') as MusicType[],
      durationBuckets: readMulti('durationBuckets') as DurationBucket[],
      yearFrom: parseYear(searchParams.get('from')),
      yearTo: parseYear(searchParams.get('to')),
      sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
      includeSubsequentReleases: searchParams.get('subsequent') === '1',
    }),
    [searchParams, readMulti],
  );

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const toggle = useCallback(
    (key: MultiFilterKey, value: string) => {
      update((params) => {
        const current = (params.get(PARAM[key]) ?? '').split(',').filter(Boolean);
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        if (next.length) params.set(PARAM[key], next.join(','));
        else params.delete(PARAM[key]);
      });
    },
    [update],
  );

  const setQ = useCallback(
    (value: string) => {
      update((params) => {
        if (value.trim()) params.set('q', value);
        else params.delete('q');
      });
    },
    [update],
  );

  const setYearRange = useCallback(
    (from: number | null, to: number | null) => {
      update((params) => {
        if (from === null) params.delete('from');
        else params.set('from', String(from));
        if (to === null) params.delete('to');
        else params.set('to', String(to));
      });
    },
    [update],
  );

  const setSort = useCallback(
    (sort: SortDirection) => {
      update((params) => {
        if (sort === 'asc') params.delete('sort');
        else params.set('sort', sort);
      });
    },
    [update],
  );

  const setIncludeSubsequent = useCallback(
    (include: boolean) => {
      update((params) => {
        if (include) params.set('subsequent', '1');
        else params.delete('subsequent');
      });
    },
    [update],
  );

  const clearGroup = useCallback(
    (key: MultiFilterKey) => {
      update((params) => params.delete(PARAM[key]));
    },
    [update],
  );

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];

    for (const key of Object.keys(PARAM) as MultiFilterKey[]) {
      for (const value of state[key] as string[]) {
        chips.push({
          id: `${key}:${value}`,
          group: GROUP_LABEL[key],
          label: valueLabel(key, value),
          remove: () => toggle(key, value),
        });
      }
    }

    if (state.yearFrom !== null || state.yearTo !== null) {
      const from = state.yearFrom ?? '…';
      const to = state.yearTo ?? '…';
      chips.push({
        id: 'years',
        group: 'Years',
        label: state.yearFrom === state.yearTo ? String(from) : `${from}–${to}`,
        remove: () => setYearRange(null, null),
      });
    }

    if (state.q.trim()) {
      chips.push({
        id: 'q',
        group: 'Search',
        label: `“${state.q.trim()}”`,
        remove: () => setQ(''),
      });
    }

    if (state.includeSubsequentReleases) {
      chips.push({
        id: 'subsequent',
        group: 'Appearances',
        label: 'Including later releases',
        remove: () => setIncludeSubsequent(false),
      });
    }

    return chips;
  }, [state, toggle, setYearRange, setQ, setIncludeSubsequent]);

  const query = useMemo<TimelineQuery>(
    () => ({
      ...base,
      ...(state.q.trim() ? { q: state.q.trim() } : {}),
      ...(state.roles.length ? { roles: state.roles } : {}),
      ...(state.languages.length ? { languages: state.languages } : {}),
      ...(state.releaseTypes.length ? { releaseTypes: state.releaseTypes } : {}),
      ...(state.classifications.length ? { classifications: state.classifications } : {}),
      ...(state.contexts.length ? { contexts: state.contexts } : {}),
      ...(state.musicTypes.length ? { musicTypes: state.musicTypes } : {}),
      ...(state.durationBuckets.length ? { durationBuckets: state.durationBuckets } : {}),
      ...(state.yearFrom !== null ? { yearFrom: state.yearFrom } : {}),
      ...(state.yearTo !== null ? { yearTo: state.yearTo } : {}),
      sort: state.sort,
      includeSubsequentReleases: state.includeSubsequentReleases,
    }),
    // `base` is an object literal at most call sites; compare by content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, JSON.stringify(base)],
  );

  return {
    state,
    query,
    activeFilters,
    activeCount: activeFilters.length,
    isActive: (key, value) => (state[key] as string[]).includes(value),
    toggle,
    setQ,
    setYearRange,
    setSort,
    setIncludeSubsequent,
    clearGroup,
    clearAll,
  };
}
