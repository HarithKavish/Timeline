import { useState } from 'react';
import type { NewsArticle, NewsThreadEntry } from '../../types/news';
import { ChevronDownIcon } from '../ui/Icon';
import { formatNewsTimestamp, formatRelativeTime } from '../../utils/newsTime';
import { pluralise } from '../../utils/format';
import './news.css';

interface OutletGroup {
  outletId: string;
  outletName: string;
  domain: string;
  articles: NewsArticle[];
}

/** Articles in one thread entry, grouped by outlet — an outlet posting 3 updates about the same development is one source, not three. */
function groupByOutlet(articles: NewsArticle[]): OutletGroup[] {
  const groups = new Map<string, OutletGroup>();
  for (const article of articles) {
    const existing = groups.get(article.outletId);
    if (existing) {
      existing.articles.push(article);
      continue;
    }
    let domain = '';
    try {
      domain = new URL(article.url).hostname;
    } catch {
      // malformed article URL — favicon just won't render for this group
    }
    groups.set(article.outletId, { outletId: article.outletId, outletName: article.outletName, domain, articles: [article] });
  }
  return [...groups.values()];
}

function faviconTooltip(group: OutletGroup): string {
  const first = group.articles[0]!.title;
  return group.articles.length === 1
    ? `${group.outletName}: ${first}`
    : `${group.outletName} (${group.articles.length} articles): ${first}`;
}

/**
 * The thread: every distinct development in a topic, earliest first. Each
 * entry lists the real articles judged to report that same development —
 * that grouping *is* the corroboration a reader is meant to see, which is
 * why it's outlets (not raw article count) driving both the count and the
 * favicon stack: one outlet posting three updates about the same fact is
 * one source, not three.
 */
export function ThreadTimeline({ entries }: { entries: NewsThreadEntry[] }) {
  return (
    <ol className="thread">
      {entries.map((entry, index) => (
        <ThreadEntryRow key={entry.id} entry={entry} index={index} />
      ))}
    </ol>
  );
}

function ThreadEntryRow({ entry, index }: { entry: NewsThreadEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupByOutlet(entry.articles);
  const visible = groups.slice(0, 2);
  const extra = groups.length - visible.length;

  return (
    <li className="thread-entry">
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

        <button
          type="button"
          className="thread-entry__sources"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          <span className="thread-entry__favicons">
            {visible.map((group) => (
              <img
                key={group.outletId}
                className="thread-entry__favicon"
                src={`https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(group.domain)}`}
                alt=""
                title={faviconTooltip(group)}
                loading="lazy"
              />
            ))}
            {extra > 0 ? <span className="thread-entry__favicon-more">+{extra}</span> : null}
          </span>
          <span className="thread-entry__source-count muted">
            {groups.length} {pluralise(groups.length, 'outlet')}
            {entry.articles.length !== groups.length ? ` · ${entry.articles.length} ${pluralise(entry.articles.length, 'article')}` : ''}
          </span>
          <ChevronDownIcon
            size={14}
            className={`thread-entry__chevron${expanded ? ' thread-entry__chevron--open' : ''}`}
          />
        </button>

        {expanded ? (
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
        ) : null}
      </div>
    </li>
  );
}
