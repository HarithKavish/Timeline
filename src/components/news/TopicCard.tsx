import { Link } from 'react-router-dom';
import { NEWS_CATEGORY_LABEL } from '../../types/news';
import type { NewsTopic } from '../../types/news';
import { Chip } from '../ui/Primitives';
import { formatNewsTimestamp, formatRelativeTime } from '../../utils/newsTime';
import { pluralise } from '../../utils/format';
import './news.css';

/** `showCategory` is off inside a category section (the heading already says it) and on in mixed lists like the browse page. */
export function TopicCard({ topic, showCategory = false }: { topic: NewsTopic; showCategory?: boolean }) {
  return (
    <li className="topic-card">
      <Link className="topic-card__link" to={`/news/topic/${topic.id}`}>
        <div className="topic-card__head">
          <Chip tone={topic.status === 'developing' ? 'accent' : 'neutral'}>
            {topic.status === 'developing' ? 'Developing' : 'Settled'}
          </Chip>
          {showCategory ? <Chip>{NEWS_CATEGORY_LABEL[topic.category]}</Chip> : null}
          <span className="topic-card__updated mono" title={formatNewsTimestamp(topic.lastUpdatedAt)}>
            {formatRelativeTime(topic.lastUpdatedAt)}
          </span>
        </div>

        <h3 className="topic-card__title">{topic.title}</h3>

        <div className="topic-card__meta">
          <span>
            {topic.outletCount} {pluralise(topic.outletCount, 'outlet')}
          </span>
          <span className="subtle">·</span>
          <span>
            {topic.entryCount} {pluralise(topic.entryCount, 'update')}
          </span>
          <span className="subtle">·</span>
          <span className="subtle">First seen {formatNewsTimestamp(topic.firstSeenAt)}</span>
        </div>
      </Link>
    </li>
  );
}
