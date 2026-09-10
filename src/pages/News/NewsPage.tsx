import { Link } from 'react-router-dom';
import { useQuery } from '../../hooks/useQuery';
import { getNewsByCategory, getNewsOutlets } from '../../services/newsService';
import { LiveNotice } from '../../components/news/LiveNotice';
import { NewsErrorState } from '../../components/news/NewsErrorState';
import { TopicCard } from '../../components/news/TopicCard';
import { EmptyState, LoadingState, Section } from '../../components/ui/Primitives';
import { NEWS_CATEGORIES, NEWS_CATEGORY_LABEL } from '../../types/news';
import type { NewsCategory, NewsTopic } from '../../types/news';
import '../../styles/pages.css';
import '../../components/news/news.css';

const CATEGORY_DESCRIPTION: Record<NewsCategory, string> = {
  international: 'Everywhere but home — five outlets, none of them Indian.',
  national: 'India.',
  state: 'Tamil Nadu.',
  city: 'Rajapalayam.',
};

const CITY_BLOCKED_NOTE =
  "Currently empty: the only free source for Rajapalayam-specific coverage is a Google News search feed, and Google returns 503 specifically to this worker's Cloudflare network range — the identical request succeeds from an ordinary connection. This is an infrastructure block, not a timing issue; refreshing won't fix it.";

const TOPICS_PER_CATEGORY = 3;

/** The News homepage: four categories shown directly, latest topics first — no search box in the way. */
export function NewsPage() {
  const outletsState = useQuery(getNewsOutlets, []);
  const categorizedState = useQuery(() => getNewsByCategory(TOPICS_PER_CATEGORY), []);

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
          The latest {TOPICS_PER_CATEGORY} topics in each of four tiers, newest first — every
          topic a cluster of articles on the same real-world story, each with a chronological
          thread of the distinct developments in it, corroborated by whichever outlets reported
          them.
        </p>
      </header>

      <LiveNotice outlets={outlets} />

      {categorizedState.status === 'loading' ? <LoadingState label="Loading news…" /> : null}
      {categorizedState.status === 'error' ? <NewsErrorState error={categorizedState.error} /> : null}

      {categorizedState.status === 'success' ? (
        <>
          {NEWS_CATEGORIES.map((category) => (
            <CategorySection
              key={category}
              category={category}
              topics={categorizedState.data[category]}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}

function CategorySection({ category, topics }: { category: NewsCategory; topics: NewsTopic[] }) {
  return (
    <Section
      eyebrow={CATEGORY_DESCRIPTION[category]}
      title={NEWS_CATEGORY_LABEL[category]}
      action={
        <Link className="link" to={`/news/browse?category=${category}`}>
          See all
        </Link>
      }
    >
      {topics.length === 0 ? (
        <EmptyState title={category === 'city' ? 'No Rajapalayam coverage reachable right now' : 'Nothing ingested yet in this category'}>
          {category === 'city' ? CITY_BLOCKED_NOTE : 'The pipeline polls every 5 minutes — check back shortly.'}
        </EmptyState>
      ) : (
        <ul className="topic-list">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </ul>
      )}
    </Section>
  );
}
