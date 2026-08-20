import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { search as runSearch } from '../../services';
import { useDebounced, useQuery } from '../../hooks/useQuery';
import { SearchResults } from '../../components/search/SearchResults';
import { DemoNotice, EmptyState, LoadingState } from '../../components/ui/Primitives';
import { SearchIcon } from '../../components/ui/Icon';
import '../../styles/pages.css';

/**
 * The addressable counterpart to the ⌘K dialog. Same service call, same result
 * component — this page exists so a search can be linked to and shared.
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [term, setTerm] = useState(initial);
  const debounced = useDebounced(term, 200);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debounced.trim()) next.set('q', debounced.trim());
    else next.delete('q');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const state = useQuery(() => runSearch(debounced), [debounced]);

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>Search</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow page-head__eyebrow">Across the catalogue</p>
        <h1 className="page-head__title display">Search</h1>
        <p className="page-head__lede">
          Creators, works, releases and films. Results are grouped by what they are, because
          &ldquo;which creators match&rdquo; and &ldquo;which works match&rdquo; are different
          questions.
        </p>

        <div className="search-page__field">
          <SearchIcon size={18} className="search-dialog__icon" />
          <input
            type="search"
            className="search-dialog__input"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search the catalogue…"
            aria-label="Search the catalogue"
            autoFocus
          />
        </div>
      </header>

      <DemoNotice compact />

      {term.trim().length < 2 ? (
        <EmptyState title="Type at least two characters">
          Try a creator (&ldquo;Ilaiyaraaja&rdquo;), a work (&ldquo;Kannalane&rdquo;), a film
          (&ldquo;Roja&rdquo;), or a release.
        </EmptyState>
      ) : state.status === 'loading' ? (
        <LoadingState label="Searching…" />
      ) : state.status === 'error' ? (
        <EmptyState title="Search failed">{state.error.message}</EmptyState>
      ) : state.data.total === 0 ? (
        <EmptyState title={`Nothing matches “${state.data.query}”`}>
          The demonstration catalogue covers a small slice of Tamil music between 1976 and 2023.
        </EmptyState>
      ) : (
        <div className="search-page__results">
          <p className="explorer__count">
            <strong className="mono">{state.data.total}</strong>{' '}
            {state.data.total === 1 ? 'match' : 'matches'}
          </p>
          <SearchResults response={state.data} />
        </div>
      )}
    </div>
  );
}
