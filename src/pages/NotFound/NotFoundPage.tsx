import { Link } from 'react-router-dom';
import '../../styles/pages.css';

export function NotFoundPage() {
  return (
    <div className="page">
      <div className="placeholder">
        <p className="eyebrow">404</p>
        <h1 className="placeholder__title display">No entry at this address</h1>
        <p className="placeholder__body">
          Nothing in the catalogue is filed here. If you followed a link to a work or creator,
          the slug may have changed while the demonstration dataset was being assembled.
        </p>
        <p style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)' }}>
          <Link className="button button--primary" to="/music/timeline">
            Open the timeline
          </Link>
          <Link className="button" to="/">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
