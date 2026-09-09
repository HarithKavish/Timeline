import { Link } from 'react-router-dom';
import { useQuery } from '../../hooks/useQuery';
import { useNewsFilters } from '../../hooks/useNewsFilters';
import { getNewsOutlets, getNewsTopics } from '../../services/newsService';
import { LiveNotice } from '../../components/news/LiveNotice';
import { NewsErrorState } from '../../components/news/NewsErrorState';
import { NewsFilters } from '../../components/news/NewsFilters';
import { TopicCard } from '../../components/news/TopicCard';
import { EmptyState, LoadingState } from '../../components/ui/Primitives';
import '../../styles/pages.css';

export function NewsPage() {
  const controller = useNewsFilters();
  const outletsState = useQuery(getNewsOutlets, []);
  const topicsState = useQuery(() => getNewsTopics(controller.query), [JSON.stringify(controller.query)]);

  const outlets = outletsState.status === 'success' ? outletsState.data : [];

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>News</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow page-head__eyebrow">News · live</p>
        <h1 className="page-head__title display">The news timeline</h1>
        <p className="page-head__lede">
          Live RSS from several outlets, deduplicated and clustered into <strong>topics</strong> —
          the same real-world story — each with a chronological <strong>thread</strong> of the
          distinct developments in it, and every development corroborated by whichever outlets
          reported it.
        </p>
      </header>

      <LiveNotice outlets={outlets} />

      <NewsFilters controller={controller} outlets={outlets} />

      {topicsState.status === 'loading' ? <LoadingState label="Loading topics…" /> : null}
      {topicsState.status === 'error' ? <NewsErrorState error={topicsState.error} /> : null}
      {topicsState.status === 'success' ? <NewsTopicResults topics={topicsState.data} /> : null}
    </div>
  );
}

function NewsTopicResults({ topics }: { topics: Awaited<ReturnType<typeof getNewsTopics>> }) {
  if (topics.items.length === 0) {
    return (
      <EmptyState title="No topics match these filters">
        Try clearing the search term or outlet filter.
      </EmptyState>
    );
  }
  return (
    <>
      <p className="explorer__count">
        {topics.total} {topics.total === 1 ? 'topic' : 'topics'}
      </p>
      <ul className="topic-list">
        {topics.items.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </ul>
    </>
  );
}
