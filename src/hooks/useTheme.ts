import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * The key is shared with every other harithkavish.com surface through
 * HarithStore (a cookie on .harithkavish.com), so a theme chosen here is the
 * theme there and the other way round.
 *
 * Timeline's preference is three-state where the shared toggle is two. That
 * costs nothing: the shared reader treats any value other than 'light' or
 * 'dark' as "follow the system", which is exactly what 'system' means here.
 */
const KEY = 'theme';
const LEGACY_KEY = 'timeline.theme';

type Store = {
  get(key: string): string | null;
  set(key: string, value: string): unknown;
  remove(key: string): void;
  migrate(key: string, legacy: string): void;
  subscribe(fn: (key: string, value: string | null) => void): void;
};

declare global {
  interface Window {
    HarithStore?: Store;
  }
}

/* Falls back to this origin's own storage where the shared store is absent —
   a preview deployment, or a browser refusing cookies. */
const store: Store = (typeof window !== 'undefined' && window.HarithStore) || {
  get: (k) => {
    try {
      return localStorage.getItem(`hk.${k}`);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(`hk.${k}`, v);
    } catch {
      /* storage blocked */
    }
  },
  remove: (k) => {
    try {
      localStorage.removeItem(`hk.${k}`);
    } catch {
      /* storage blocked */
    }
  },
  migrate: () => {},
  subscribe: () => {},
};

function read(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  store.migrate(KEY, LEGACY_KEY);
  const stored = store.get(KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function apply(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);
}

/**
 * Three-state theme: system (no attribute), light, dark. The stamped attribute
 * is what the CSS toggle scope reads.
 */
export function useTheme(): {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  cycle: () => void;
} {
  const [preference, setPreferenceState] = useState<ThemePreference>(read);

  useEffect(() => {
    apply(preference);
    /* 'system' is written rather than cleared, so every other surface follows
       the operating system too instead of falling back to whatever it held. */
    store.set(KEY, preference);
  }, [preference]);

  /* Changed on another surface — adopt it rather than disagreeing. */
  useEffect(() => {
    store.subscribe((key, value) => {
      if (key !== KEY) return;
      const next: ThemePreference =
        value === 'light' || value === 'dark' ? value : 'system';
      setPreferenceState((current) => (current === next ? current : next));
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => setPreferenceState(next), []);

  const cycle = useCallback(() => {
    setPreferenceState((current) =>
      current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system',
    );
  }, []);

  return { preference, setPreference, cycle };
}
