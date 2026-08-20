import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { search as runSearch } from '../../services';
import { useDebounced, useQuery } from '../../hooks/useQuery';
import { useScrollLock } from '../../hooks/useMediaQuery';
import { CloseIcon, SearchIcon } from '../ui/Icon';
import { SearchResults } from './SearchResults';
import type { SearchHit } from '../../types/api';
import './search.css';

interface SearchDialogContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const SearchDialogContext = createContext<SearchDialogContextValue | null>(null);

export function useSearchDialog(): SearchDialogContextValue {
  const context = useContext(SearchDialogContext);
  if (!context) throw new Error('useSearchDialog must be used inside SearchProvider');
  return context;
}

/**
 * Global search.
 *
 * The dialog talks to the same `search()` service function the /search page
 * uses, so replacing the mock with an HTTP call changes neither surface.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((current) => !current);
      }
      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <SearchDialogContext.Provider value={value}>
      {children}
      {isOpen ? <SearchDialog onClose={close} /> : null}
    </SearchDialogContext.Provider>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [term, setTerm] = useState('');
  const debounced = useDebounced(term, 140);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const hitRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeIndex, setActiveIndex] = useState(0);

  useScrollLock(true);

  const state = useQuery(() => runSearch(debounced), [debounced]);
  const flatHits = useMemo<SearchHit[]>(
    () => (state.data ? state.data.groups.flatMap((group) => group.hits) : []),
    [state.data],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [debounced]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatHits.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const hit = flatHits[activeIndex];
      if (hit?.href) {
        onClose();
        navigate(hit.href);
      } else if (term.trim()) {
        onClose();
        navigate(`/search?q=${encodeURIComponent(term.trim())}`);
      }
    }
  };

  useEffect(() => {
    const hit = flatHits[activeIndex];
    if (!hit) return;
    hitRefs.current.get(hit.id)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, flatHits]);

  const activeHit = flatHits[activeIndex];

  return (
    <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search Timeline">
      <button type="button" className="search-dialog__scrim" aria-label="Close search" onClick={onClose} />
      <div className="search-dialog__panel" onKeyDown={onKeyDown}>
        <div className="search-dialog__field">
          <SearchIcon size={18} className="search-dialog__icon" />
          <input
            ref={inputRef}
            type="search"
            className="search-dialog__input"
            placeholder="Search creators, works, releases, films…"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search the catalogue"
          />
          <button type="button" className="search-dialog__close" onClick={onClose} aria-label="Close search">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="search-dialog__body">
          {term.trim().length < 2 ? (
            <p className="search-dialog__hint subtle">
              Type at least two characters. Search covers creators, works, releases and films
              in the demonstration catalogue.
            </p>
          ) : state.status === 'loading' ? (
            <p className="search-dialog__hint subtle">Searching…</p>
          ) : state.status === 'error' ? (
            <p className="search-dialog__hint subtle">Search failed: {state.error.message}</p>
          ) : state.data.total === 0 ? (
            <p className="search-dialog__hint subtle">
              Nothing in the catalogue matches “{state.data.query}”.
            </p>
          ) : (
            <SearchResults
              response={state.data}
              {...(activeHit ? { activeId: activeHit.id } : {})}
              onNavigate={onClose}
              registerRef={(id, element) => {
                if (element) hitRefs.current.set(id, element);
                else hitRefs.current.delete(id);
              }}
            />
          )}
        </div>

        <footer className="search-dialog__foot">
          <span className="mono">↑↓ navigate</span>
          <span className="mono">↵ open</span>
          <span className="mono">esc close</span>
        </footer>
      </div>
    </div>
  );
}
