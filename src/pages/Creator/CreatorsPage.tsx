import { Link, useSearchParams } from 'react-router-dom';
import { listCreators } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { MusicNav } from '../../components/navigation/MusicNav';
import { CreatorCard, CreatorGrid } from '../../components/creators/CreatorCard';
import { DemoNotice, EmptyState, ErrorState, LoadingState } from '../../components/ui/Primitives';
import { FILTERABLE_ROLES, ROLE_LABEL } from '../../utils/format';
import type { CreatorRole } from '../../types/music';
import '../../styles/pages.css';

export function CreatorsPage() {
  const [params, setParams] = useSearchParams();
  const role = (params.get('role') as CreatorRole | null) ?? undefined;
  const term = params.get('q') ?? '';

  const state = useQuery(
    () => listCreators({ ...(role ? { role } : {}), ...(term ? { q: term } : {}) }),
    [role, term],
  );

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <Link to="/music">Music</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>Creators</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow page-head__eyebrow">Music · people</p>
        <h1 className="page-head__title display">Creators</h1>
        <p className="page-head__lede">
          Everyone credited on a catalogued entry — composers, lyricists, vocalists, arrangers,
          and the groups credited as a unit. The bar under each name is their output per year.
        </p>
      </header>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <MusicNav />
      </div>

      <DemoNotice compact />

      <div className="active-filters" style={{ paddingTop: 'var(--space-4)' }}>
        <label className="sr-only" htmlFor="creator-search">
          Filter creators by name
        </label>
        <input
          id="creator-search"
          type="search"
          className="creators-search"
          placeholder="Filter by name…"
          value={term}
          onChange={(event) => update('q', event.target.value || null)}
        />
        <ul className="active-filters__list">
          <li>
            <button
              type="button"
              className="filter-option"
              aria-pressed={!role}
              onClick={() => update('role', null)}
            >
              <span className="filter-option__box" aria-hidden="true" />
              <span>All roles</span>
            </button>
          </li>
          {FILTERABLE_ROLES.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="filter-option"
                aria-pressed={role === option}
                onClick={() => update('role', role === option ? null : option)}
              >
                <span className="filter-option__box" aria-hidden="true" />
                <span>{ROLE_LABEL[option]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {state.status === 'loading' ? (
        <LoadingState />
      ) : state.status === 'error' ? (
        <ErrorState error={state.error} />
      ) : state.data.items.length === 0 ? (
        <EmptyState title="No creators match">
          Try a different name, or clear the role filter.
        </EmptyState>
      ) : (
        <>
          <p className="explorer__count" style={{ padding: 'var(--space-2) 0' }}>
            <strong className="mono">{state.data.items.length}</strong>{' '}
            {state.data.items.length === 1 ? 'creator' : 'creators'}
            {role ? <span className="subtle"> credited as {ROLE_LABEL[role].toLowerCase()}</span> : null}
          </p>
          <CreatorGrid>
            {state.data.items.map((summary) => (
              <CreatorCard key={summary.creator.id} summary={summary} />
            ))}
          </CreatorGrid>
        </>
      )}
    </div>
  );
}
