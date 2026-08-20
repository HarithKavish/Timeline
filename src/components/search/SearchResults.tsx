import { Link } from 'react-router-dom';
import type { SearchHit, SearchResponse } from '../../types/api';
import './search.css';

function Highlight({ hit }: { hit: SearchHit }) {
  if (!hit.match) return <>{hit.title}</>;
  const { start, end } = hit.match;
  return (
    <>
      {hit.title.slice(0, start)}
      <mark className="search-mark">{hit.title.slice(start, end)}</mark>
      {hit.title.slice(end)}
    </>
  );
}

export function SearchHitRow({
  hit,
  active,
  onNavigate,
  innerRef,
}: {
  hit: SearchHit;
  active?: boolean;
  onNavigate?: () => void;
  innerRef?: (element: HTMLAnchorElement | null) => void;
}) {
  const content = (
    <>
      <span className="search-hit__title">
        <Highlight hit={hit} />
      </span>
      <span className="search-hit__subtitle subtle">{hit.subtitle}</span>
      {hit.year !== null ? <span className="search-hit__year mono">{hit.year}</span> : null}
    </>
  );

  if (!hit.href) {
    return <span className="search-hit search-hit--inert">{content}</span>;
  }

  return (
    <Link
      ref={innerRef}
      className={`search-hit${active ? ' search-hit--active' : ''}`}
      to={hit.href}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}

/**
 * Results are grouped by entity type rather than merged into one ranked list —
 * "which creators match" and "which works match" are different questions.
 */
export function SearchResults({
  response,
  activeId,
  onNavigate,
  registerRef,
}: {
  response: SearchResponse;
  activeId?: string;
  onNavigate?: () => void;
  registerRef?: (id: string, element: HTMLAnchorElement | null) => void;
}) {
  return (
    <div className="search-results">
      {response.groups.map((group) => (
        <section key={group.type} className="search-group">
          <h3 className="search-group__title eyebrow">{group.label}</h3>
          <ul>
            {group.hits.map((hit) => (
              <li key={hit.id}>
                <SearchHitRow
                  hit={hit}
                  active={activeId === hit.id}
                  {...(onNavigate ? { onNavigate } : {})}
                  {...(registerRef
                    ? { innerRef: (element) => registerRef(hit.id, element) }
                    : {})}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
