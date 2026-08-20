import { Fragment, useMemo } from 'react';
import type { TimelineEntry } from '../../types/music';
import type { SortDirection } from '../../types/api';
import { decadeLabel } from '../../utils/date';
import { TimelineRow } from './TimelineRow';
import './timeline.css';

interface Group {
  key: string;
  year: number | null;
  decade: number | null;
  entries: TimelineEntry[];
}

/**
 * Chronology is the structure of the page, not a column in a table: entries are
 * grouped under their year, years band into decades, and undated entries are
 * held apart at the end rather than being slotted into a year they don't have.
 */
export function TimelineList({
  entries,
  sort,
}: {
  entries: TimelineEntry[];
  sort: SortDirection;
}) {
  const groups = useMemo<Group[]>(() => {
    const out: Group[] = [];
    for (const entry of entries) {
      const key = entry.year === null ? 'undated' : String(entry.year);
      const last = out[out.length - 1];
      if (last && last.key === key) last.entries.push(entry);
      else
        out.push({
          key,
          year: entry.year,
          decade: entry.year === null ? null : Math.floor(entry.year / 10) * 10,
          entries: [entry],
        });
    }
    return out;
  }, [entries]);

  return (
    <ol className="timeline">
      {groups.map((group, index) => {
        const previous = groups[index - 1];
        const showDecade =
          group.decade !== null && (index === 0 || previous?.decade !== group.decade);

        return (
          <Fragment key={group.key}>
            {showDecade ? (
              <li className="timeline__decade" aria-hidden="true">
                <span className="timeline__decade-label mono">{decadeLabel(group.year!)}</span>
                <span className="timeline__decade-rule" />
              </li>
            ) : null}

            <li className="timeline__group">
              <div className="timeline__year">
                <h3 className="timeline__year-label mono">
                  {group.year ?? 'Undated'}
                  <span className="timeline__year-count">
                    {group.entries.length}
                    <span className="sr-only"> entries</span>
                  </span>
                </h3>
                {group.year === null ? (
                  <p className="timeline__year-note subtle">
                    No source establishes a date. These entries are catalogued but never
                    placed in the chronology.
                  </p>
                ) : null}
              </div>

              <ol className="timeline__items">
                {group.entries.map((entry) => (
                  <TimelineRow key={entry.id} entry={entry} />
                ))}
              </ol>
            </li>
          </Fragment>
        );
      })}

      {entries.length > 0 ? (
        <li className="timeline__terminus" aria-hidden="true">
          <span className="mono">
            {sort === 'asc' ? 'latest entry in view' : 'earliest entry in view'}
          </span>
        </li>
      ) : null}
    </ol>
  );
}
