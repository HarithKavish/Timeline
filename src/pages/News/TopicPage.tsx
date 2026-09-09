import { Link, useParams } from 'react-router-dom';
import { useQuery } from '../../hooks/useQuery';
import { getNewsTopic } from '../../services/newsService';
import { NewsErrorState } from '../../components/news/NewsErrorState';
import { ThreadTimeline } from '../../components/news/ThreadTimeline';
import { Chip, LoadingState } from '../../components/ui/Primitives';
import { formatNewsTimestamp, formatRelativeTime } from '../../utils/newsTime';
import { pluralise } from '../../utils/format';
import '../../styles/pages.css';
import '../../components/news/news.css';

export function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const topicState = useQuery(() => getNewsTopic(id ?? ''), [id]);

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <Link to="/news">News</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>{topicState.status === 'success' ? topicState.data.title : 'Topic'}</span>
      </nav>

      {topicState.status === 'loading' ? <LoadingState label="Loading topic…" /> : null}
      {topicState.status === 'error' ? <NewsErrorState error={topicState.error} /> : null}

      {topicState.status === 'success' ? (
        <>
          <header className="topic-head">
            <div className="topic-head__badges">
              <Chip tone={topicState.data.status === 'developing' ? 'accent' : 'neutral'}>
                {topicState.data.status === 'developing' ? 'Developing' : 'Settled'}
              </Chip>
              <span className="subtle mono">
                Updated {formatRelativeTime(topicState.data.lastUpdatedAt)}
              </span>
            </div>
            <h1 className="topic-head__title display">{topicState.data.title}</h1>
            <p className="topic-head__meta">
              <span>First seen {formatNewsTimestamp(topicState.data.firstSeenAt)}</span>
              <span>
                {topicState.data.outletCount} {pluralise(topicState.data.outletCount, 'outlet')} reporting
              </span>
              <span>
                {topicState.data.articleCount} {pluralise(topicState.data.articleCount, 'article')} across{' '}
                {topicState.data.entryCount} {pluralise(topicState.data.entryCount, 'update')}
              </span>
            </p>
          </header>

          <ThreadTimeline entries={topicState.data.thread} />
        </>
      ) : null}
    </div>
  );
}
