import type { NewsThreadEntry } from '../../types/news';
import { formatNewsTimestamp, formatRelativeTime } from '../../utils/newsTime';
import { pluralise } from '../../utils/format';
import './news.css';

/**
 * The thread: every distinct development in a topic, earliest first. Each
 * entry lists the real articles judged to report that same development —
 * that list *is* the corroboration a reader is meant to see.
 */
export function ThreadTimeline({ entries }: { entries: NewsThreadEntry[] }) {
  return (
    <ol className="thread">
      {entries.map((entry, index) => (
        <li key={entry.id} className="thread-entry">
          <div className="thread-entry__spine" aria-hidden="true">
            <span className="thread-entry__node" />
          </div>
          <div className="thread-entry__body">
            <div className="thread-entry__meta">
              <span className="thread-entry__index mono">{index + 1}</span>
              <span className="mono" title={formatNewsTimestamp(entry.occurredAt)}>
                {formatNewsTimestamp(entry.occurredAt)}
              </span>
              <span className="subtle">({formatRelativeTime(entry.occurredAt)})</span>
            </div>
            <h3 className="thread-entry__headline">{entry.headline}</h3>
            <p className="thread-entry__corroboration muted">
              Reported by {entry.articles.length} {pluralise(entry.articles.length, 'outlet')}
            </p>
            <ul className="thread-entry__articles">
              {entry.articles.map((article) => (
                <li key={article.id} className="thread-article">
                  <a
                    className="thread-article__link"
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="thread-article__outlet">{article.outletName}</span>
                    <span className="thread-article__title">{article.title}</span>
                  </a>
                  <span className="thread-article__time mono subtle">
                    {formatRelativeTime(article.publishedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
