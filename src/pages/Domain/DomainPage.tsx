import { Link, useLocation } from 'react-router-dom';
import { domainByPath } from '../../data/domains';
import { SearchLauncher } from '../../components/search/SearchLauncher';
import '../../styles/pages.css';

/**
 * Placeholder for a domain that is modelled but not yet catalogued. It states
 * plainly what exists and what does not, rather than pretending to be empty
 * content.
 */
export function DomainPage() {
  const location = useLocation();
  const domain = domainByPath.get(location.pathname);

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>{domain?.label ?? 'Domain'}</span>
      </nav>

      <div className="placeholder">
        <p className="eyebrow">Planned domain</p>
        <h1 className="placeholder__title display">{domain?.label ?? 'This domain'}</h1>
        <p className="placeholder__body">
          {domain?.blurb ?? 'This domain is declared but not yet catalogued.'} Nothing is
          catalogued here yet — and Timeline would rather show you an empty shelf than a
          plausible-looking one.
        </p>
        <p className="placeholder__body">
          The domain model is already shared: a {domain?.label.toLowerCase() ?? 'work'} is a
          work with creators, dated release events and per-fact provenance, exactly like a
          recording. Adding a domain is a data problem, not a rewrite.
        </p>

        <ul className="placeholder__list">
          <li>
            <span>Now</span>
            <span>Music is catalogued and browsable, on demonstration data.</span>
          </li>
          <li>
            <span>Next</span>
            <span>
              A backend and a real database replace the in-memory service layer behind the same
              API shapes.
            </span>
          </li>
          <li>
            <span>Then</span>
            <span>
              Source ingestion and reconciliation, so facts arrive with provenance attached
              rather than authored by hand.
            </span>
          </li>
          <li>
            <span>After</span>
            <span>Further domains, starting with the one you are looking at.</span>
          </li>
        </ul>

        <div style={{ marginTop: 'var(--space-6)', maxWidth: '28rem' }}>
          <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
            In the meantime
          </p>
          <SearchLauncher placeholder="Search the music catalogue…" />
        </div>

        <p style={{ marginTop: 'var(--space-5)' }}>
          <Link className="button" to="/music">
            Open the Music domain
          </Link>
        </p>
      </div>
    </div>
  );
}
