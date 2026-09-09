import { Link } from 'react-router-dom';

export function NewsErrorState({ error }: { error: Error }) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title display">The news service could not be reached</p>
      <p className="state__body muted">{error.message}</p>
      <div className="state__action">
        <Link className="button" to="/news">
          Back to the news timeline
        </Link>
      </div>
    </div>
  );
}
