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
  district: 'Virudhunagar — the whole district: its towns and villages, not just one city.',
  city: 'Rajapalayam specifically.',
};

/** District and City both depend on a Google News search feed, which is blocked for this worker the same way — see workers/news/README.md. */
const GOOGLE_BLOCKED_CATEGORIES = new Set<NewsCategory>(['district', 'city']);

function blockedNote(category: NewsCategory): string {
  const place = category === 'district' ? 'Virudhunagar district' : 'Rajapalayam';
  return `The Google News search feed that would stand in for one is itself blocked for this worker's network range (confirmed — it succeeds from an ordinary connection). The District and City tiers can stall for hours at a stretch but do come through.`;
}

const TOPICS_PER_CATEGORY = 3;

/** The News homepage: five categories shown directly, latest topics first — no search box in the way. */
export function NewsPage() {
  const outletsState = useQuery(getNewsOutlets, []);
  const categorizedState = useQuery(() => getNewsByCategory(TOPICS_PER_CATEGORY), []);

  const outlets = outletsState.status === 'success' ? outletsState.data : [];
  
  // Compute actually-empty local categories from categorized query (only in success state)
  const emptyLocalCategories = categorizedState.status === 'success' 
    ? NEWS_CATEGORIES.filter(category => 
        ['district', 'city'].includes(category) && 
        !(categorizedState.data[category] || []).length
      )
    : [];

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
          The latest {TOPICS_PER_CATEGORY} topics in each of five tiers, newest first — every
          topic a cluster of articles on the same real-world story, each with a chronological
          thread of the distinct developments in it, corroborated by whichever outlets reported
          them.
        </p>
      </header>

      <LiveNotice outlets={outlets} emptyLocalCategories={emptyLocalCategories} />

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
  const blocked = GOOGLE_BLOCKED_CATEGORIES.has(category);
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
        <EmptyState title={blocked ? 'No coverage reachable right now' : 'Nothing ingested yet in this category'}>
          {blocked ? blockedNote(category) : 'The pipeline polls every 5 minutes — check back shortly.'}
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
