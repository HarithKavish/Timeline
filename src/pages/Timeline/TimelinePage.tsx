import { Link } from 'react-router-dom';
import { MusicNav } from '../../components/navigation/MusicNav';
import { TimelineExplorer } from '../../components/timeline/TimelineExplorer';
import { DemoNotice } from '../../components/ui/Primitives';
import '../../styles/pages.css';

export function TimelinePage() {
  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <Link to="/music">Music</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>Chronology</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow page-head__eyebrow">Music · chronology</p>
        <h1 className="page-head__title display">The timeline</h1>
        <p className="page-head__lede">
          Every catalogued entry in date order, with the precision each date is actually known
          to. Filters combine; the year strip below doubles as a range selector.
        </p>
      </header>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <MusicNav />
      </div>

      <DemoNotice compact />

      <TimelineExplorer />
    </div>
  );
}
