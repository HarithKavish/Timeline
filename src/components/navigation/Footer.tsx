import { Link } from 'react-router-dom';
import { domains } from '../../data/domains';
import { TimelineMark } from './AppHeader';
import './navigation.css';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__brand">
          <Link to="/" className="brand brand--footer">
            <TimelineMark size={18} />
            <span className="brand__word display">Timeline</span>
          </Link>
          <p className="app-footer__blurb muted">
            A source-backed chronological catalogue of creative works and the people who made
            them. What, who, when, how it relates, and where each fact came from.
          </p>
          <p className="app-footer__stage mono">
            Stage 1 · frontend only · demonstration dataset
          </p>
        </div>

        <nav className="app-footer__nav" aria-label="Domains">
          <h2 className="app-footer__heading eyebrow">Domains</h2>
          <ul>
            {domains.map((domain) => (
              <li key={domain.id}>
                <Link className="link" to={domain.path}>
                  {domain.label}
                </Link>
                {domain.status === 'planned' ? (
                  <span className="subtle"> · planned</span>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        <nav className="app-footer__nav" aria-label="Music">
          <h2 className="app-footer__heading eyebrow">Music</h2>
          <ul>
            <li>
              <Link className="link" to="/music/timeline">
                Chronology
              </Link>
            </li>
            <li>
              <Link className="link" to="/music/creators">
                Creators
              </Link>
            </li>
            <li>
              <Link className="link" to="/music/timeline?ctx=non-film&class=independent">
                Independent, non-film
              </Link>
            </li>
            <li>
              <Link className="link" to="/music/timeline?music=instrumental,background-score">
                Instrumental &amp; score
              </Link>
            </li>
          </ul>
        </nav>

        <div className="app-footer__nav">
          <h2 className="app-footer__heading eyebrow">About the data</h2>
          <p className="app-footer__note subtle">
            Every source record in this build is a placeholder. Locators use the
            <span className="mono"> timeline-demo:// </span>
            scheme so they can never be mistaken for citations. Ingestion, reconciliation and
            fact-level provenance arrive with the backend stage.
          </p>
        </div>
      </div>
    </footer>
  );
}
