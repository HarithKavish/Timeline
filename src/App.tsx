import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppHeader } from './components/navigation/AppHeader';
import { Footer } from './components/navigation/Footer';
import { SearchProvider } from './components/search/SearchDialog';
import { HomePage } from './pages/Home/HomePage';
import { MusicPage } from './pages/Music/MusicPage';
import { TimelinePage } from './pages/Timeline/TimelinePage';
import { CreatorsPage } from './pages/Creator/CreatorsPage';
import { CreatorPage } from './pages/Creator/CreatorPage';
import { WorkPage } from './pages/Work/WorkPage';
import { SearchPage } from './pages/Search/SearchPage';
import { DomainPage } from './pages/Domain/DomainPage';
import { NewsPage } from './pages/News/NewsPage';
import { TopicPage } from './pages/News/TopicPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

/** Restores the top of the page on navigation, but not on filter changes. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <SearchProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AppHeader />
      <ScrollToTop />
      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/music/timeline" element={<TimelinePage />} />
          <Route path="/music/creators" element={<CreatorsPage />} />
          <Route path="/music/creator/:slug" element={<CreatorPage />} />
          <Route path="/music/work/:slug" element={<WorkPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/topic/:id" element={<TopicPage />} />
          <Route path="/movies" element={<DomainPage />} />
          <Route path="/games" element={<DomainPage />} />
          <Route path="/books" element={<DomainPage />} />
          <Route path="/software" element={<DomainPage />} />
          <Route path="/technology" element={<DomainPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </SearchProvider>
  );
}
