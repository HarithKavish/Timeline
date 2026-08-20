import { useEffect, useRef, useState } from 'react';
import type { QueryState } from '../types/api';

/**
 * Minimal async data hook for the mock service layer.
 *
 * It deliberately mirrors what a real data client would give us — a loading
 * envelope and stale-response protection — so swapping in a backend later does
 * not change how components consume data.
 */
export function useQuery<T>(
  loader: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const requestId = useRef(0);

  useEffect(() => {
    const current = requestId.current + 1;
    requestId.current = current;
    let cancelled = false;

    setState((previous) =>
      previous.status === 'loading' ? previous : { status: 'loading', data: null, error: null },
    );

    loader()
      .then((data) => {
        if (cancelled || requestId.current !== current) return;
        setState({ status: 'success', data, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled || requestId.current !== current) return;
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

/** Debounces a rapidly-changing value, e.g. a search box. */
export function useDebounced<T>(value: T, delay = 180): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
