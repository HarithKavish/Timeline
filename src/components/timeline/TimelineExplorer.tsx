import { useEffect, useState } from 'react';
import { getTimeline } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useTimelineFilters } from '../../hooks/useTimelineFilters';
import type { TimelineQuery } from '../../types/api';
import {
  ActiveFilters,
  FilterPanel,
  FilterSheetTrigger,
  SortToggle,
} from '../filters/Filters';
import { Button, EmptyState, LoadingState } from '../ui/Primitives';
import { TimelineList } from './TimelineList';
import { YearDensity } from './YearDensity';
import './timeline.css';

const PAGE_SIZE = 40;

/**
 * The discovery surface, shared by the timeline page and every creator page.
 *
 * Filter state lives in the URL (see `useTimelineFilters`), so a filtered view
 * is a shareable address and the back button steps through refinements.
 */
export function TimelineExplorer({
  base = {},
  emptyHint,
}: {
  base?: Partial<TimelineQuery>;
  emptyHint?: string;
}) {
  const controller = useTimelineFilters(base);
  const isDesktop = useIsDesktop();
  const [limit, setLimit] = useState(PAGE_SIZE);

  const queryKey = JSON.stringify(controller.query);
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [queryKey]);

  const state = useQuery(
    () => getTimeline({ ...controller.query, limit }),
    [queryKey, limit],
  );

  const data = state.data;
  const span = data?.span ?? { from: 1970, to: new Date().getFullYear() };

  return (
    <div className="explorer">
      {isDesktop ? <FilterPanel controller={controller} span={span} /> : null}

      <div className="explorer__main">
        <div className="explorer__toolbar">
          <p className="explorer__count">
            {data ? (
              <>
                <strong className="mono">{data.total}</strong>{' '}
                {data.total === 1 ? 'entry' : 'entries'}
                {data.undatedCount > 0 ? (
                  <span className="subtle">
                    {' '}
                    · {data.undatedCount} undated, held out of the chronology
                  </span>
                ) : null}
              </>
            ) : (
              <span className="subtle">Counting…</span>
            )}
          </p>
          <div className="explorer__tools">
            <SortToggle controller={controller} />
            {!isDesktop ? <FilterSheetTrigger controller={controller} span={span} /> : null}
          </div>
        </div>

        {data ? (
          <YearDensity
            histogram={data.histogram}
            span={data.span}
            selected={{ from: controller.state.yearFrom, to: controller.state.yearTo }}
            onSelect={controller.setYearRange}
          />
        ) : null}

        <ActiveFilters controller={controller} />

        {state.status === 'loading' && !data ? (
          <LoadingState label="Loading the chronology…" />
        ) : state.status === 'error' ? (
          <EmptyState title="The catalogue could not be read">{state.error.message}</EmptyState>
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title="No entries match these filters"
            action={
              controller.activeCount > 0 ? (
                <Button onClick={controller.clearAll}>Clear all filters</Button>
              ) : null
            }
          >
            {emptyHint ??
              'Filters combine with AND. Removing one of the active filters above will widen the result.'}
          </EmptyState>
        ) : data ? (
          <>
            <TimelineList entries={data.items} sort={controller.state.sort} />
            {data.total > data.items.length ? (
              <div className="explorer__more">
                <Button onClick={() => setLimit((current) => current + PAGE_SIZE)}>
                  Show {Math.min(PAGE_SIZE, data.total - data.items.length)} more
                </Button>
                <span className="subtle">
                  Showing {data.items.length} of {data.total}
                </span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
