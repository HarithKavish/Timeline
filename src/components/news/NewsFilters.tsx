import type { NewsFilterController } from '../../hooks/useNewsFilters';
import type { NewsOutlet } from '../../types/news';
import { Button } from '../ui/Primitives';
import './news.css';

export function NewsFilters({
  controller,
  outlets,
}: {
  controller: NewsFilterController;
  outlets: NewsOutlet[];
}) {
  const { state, setQ, setOutlet, setStatus, setSort } = controller;

  return (
    <div className="news-filters">
      <input
        type="search"
        className="creators-search news-filters__search"
        placeholder="Search topics…"
        defaultValue={state.q}
        onChange={(event) => setQ(event.target.value)}
        aria-label="Search news topics"
      />

      <div className="news-filters__group" role="group" aria-label="Status">
        <Button variant={state.status === null ? 'primary' : 'ghost'} onClick={() => setStatus(null)}>
          All
        </Button>
        <Button
          variant={state.status === 'developing' ? 'primary' : 'ghost'}
          onClick={() => setStatus('developing')}
        >
          Developing
        </Button>
        <Button variant={state.status === 'settled' ? 'primary' : 'ghost'} onClick={() => setStatus('settled')}>
          Settled
        </Button>
      </div>

      <div className="news-filters__group" role="group" aria-label="Outlet">
        <Button variant={state.outletId === null ? 'primary' : 'ghost'} onClick={() => setOutlet(null)}>
          All outlets
        </Button>
        {outlets.map((outlet) => (
          <Button
            key={outlet.id}
            variant={state.outletId === outlet.id ? 'primary' : 'ghost'}
            onClick={() => setOutlet(state.outletId === outlet.id ? null : outlet.id)}
          >
            {outlet.name}
          </Button>
        ))}
      </div>

      <div className="news-filters__group" role="group" aria-label="Sort">
        <Button variant={state.sort === 'newest' ? 'primary' : 'ghost'} onClick={() => setSort('newest')}>
          Newest first
        </Button>
        <Button variant={state.sort === 'oldest' ? 'primary' : 'ghost'} onClick={() => setSort('oldest')}>
          Oldest first
        </Button>
      </div>
    </div>
  );
}
