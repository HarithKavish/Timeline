import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NEWS_CATEGORIES } from '../types/news';
import type { NewsCategory, NewsOutletId, NewsTimelineQuery, NewsTopicStatus } from '../types/news';

export interface NewsFilterState {
  q: string;
  category: NewsCategory | null;
  outletId: NewsOutletId | null;
  status: NewsTopicStatus | null;
  sort: 'newest' | 'oldest';
}

export interface NewsFilterController {
  state: NewsFilterState;
  query: NewsTimelineQuery;
  setQ: (value: string) => void;
  setCategory: (category: NewsCategory | null) => void;
  setOutlet: (outletId: NewsOutletId | null) => void;
  setStatus: (status: NewsTopicStatus | null) => void;
  setSort: (sort: 'newest' | 'oldest') => void;
}

/** Filter state lives in the URL, matching the music timeline's convention — shareable, back-button-able. */
export function useNewsFilters(): NewsFilterController {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<NewsFilterState>(() => {
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    return {
      q: searchParams.get('q') ?? '',
      category: NEWS_CATEGORIES.includes(category as NewsCategory) ? (category as NewsCategory) : null,
      outletId: searchParams.get('outlet'),
      status: status === 'developing' || status === 'settled' ? status : null,
      sort: searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest',
    };
  }, [searchParams]);

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setQ = useCallback(
    (value: string) => update((params) => (value.trim() ? params.set('q', value) : params.delete('q'))),
    [update],
  );
  const setCategory = useCallback(
    (category: NewsCategory | null) =>
      update((params) => (category ? params.set('category', category) : params.delete('category'))),
    [update],
  );
  const setOutlet = useCallback(
    (outletId: NewsOutletId | null) =>
      update((params) => (outletId ? params.set('outlet', outletId) : params.delete('outlet'))),
    [update],
  );
  const setStatus = useCallback(
    (status: NewsTopicStatus | null) =>
      update((params) => (status ? params.set('status', status) : params.delete('status'))),
    [update],
  );
  const setSort = useCallback(
    (sort: 'newest' | 'oldest') =>
      update((params) => (sort === 'oldest' ? params.set('sort', 'oldest') : params.delete('sort'))),
    [update],
  );

  const query = useMemo<NewsTimelineQuery>(
    () => ({
      ...(state.q.trim() ? { q: state.q.trim() } : {}),
      ...(state.category ? { category: state.category } : {}),
      ...(state.outletId ? { outletId: state.outletId } : {}),
      ...(state.status ? { status: state.status } : {}),
      sort: state.sort,
    }),
    [state],
  );

  return { state, query, setQ, setCategory, setOutlet, setStatus, setSort };
}
