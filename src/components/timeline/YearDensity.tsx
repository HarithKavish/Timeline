import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { YearBucket } from '../../types/api';
import { yearRange } from '../../utils/date';
import './timeline.css';

/**
 * Catalogue density by year — and the primary way to move around the
 * chronology. One series, so no legend: the caption says what is plotted.
 *
 * Bars are the selection control. Click a year to isolate it; shift-click a
 * second year to select the span between them.
 */
interface YearDensityProps {
  histogram: YearBucket[];
  span: { from: number; to: number };
  selected: { from: number | null; to: number | null };
  onSelect: (from: number | null, to: number | null) => void;
  height?: number;
  caption?: string;
}

const BAR_MAX_WIDTH = 24;
const GAP = 2;

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/** Rect with a 4px rounded top and a square base on the axis. */
function barPath(x: number, y: number, width: number, height: number): string {
  const radius = Math.min(4, width / 2, height);
  const bottom = y + height;
  return [
    `M${x},${bottom}`,
    `V${y + radius}`,
    `q0,${-radius} ${radius},${-radius}`,
    `h${width - radius * 2}`,
    `q${radius},0 ${radius},${radius}`,
    `V${bottom}`,
    'Z',
  ].join(' ');
}

export function YearDensity({
  histogram,
  span,
  selected,
  onSelect,
  height = 68,
  caption,
}: YearDensityProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const years = useMemo(() => yearRange(span.from, span.to), [span.from, span.to]);
  const counts = useMemo(() => {
    const map = new Map<number, number>();
    for (const bucket of histogram) map.set(bucket.year, bucket.count);
    return map;
  }, [histogram]);

  const max = Math.max(1, ...histogram.map((bucket) => bucket.count));
  const slot = years.length > 0 && width > 0 ? width / years.length : 0;
  const barWidth = Math.max(2, Math.min(BAR_MAX_WIDTH, slot - GAP));
  const plotHeight = height - 16;

  const isSelected = useCallback(
    (year: number) => {
      const { from, to } = selected;
      if (from === null && to === null) return false;
      return year >= (from ?? Number.NEGATIVE_INFINITY) && year <= (to ?? Number.POSITIVE_INFINITY);
    },
    [selected],
  );

  const handleSelect = useCallback(
    (year: number, extend: boolean) => {
      if (extend && selected.from !== null) {
        onSelect(Math.min(selected.from, year), Math.max(selected.from, year));
        return;
      }
      if (selected.from === year && selected.to === year) onSelect(null, null);
      else onSelect(year, year);
    },
    [onSelect, selected],
  );

  const hoveredCount = hovered === null ? null : (counts.get(hovered) ?? 0);
  const hasSelection = selected.from !== null || selected.to !== null;

  return (
    <figure className="density">
      <figcaption className="density__caption">
        <span className="eyebrow">{caption ?? 'Catalogued entries per year'}</span>
        <span className="density__readout mono" aria-live="polite">
          {hovered !== null
            ? `${hovered} · ${hoveredCount} ${hoveredCount === 1 ? 'entry' : 'entries'}`
            : hasSelection
              ? `${selected.from ?? '…'}–${selected.to ?? '…'} selected`
              : `${span.from}–${span.to}`}
        </span>
      </figcaption>

      <div className="density__plot" ref={containerRef} style={{ height }}>
        {width > 0 ? (
          <svg width={width} height={height} role="presentation">
            <line
              x1={0}
              y1={plotHeight + 0.5}
              x2={width}
              y2={plotHeight + 0.5}
              className="density__axis"
            />
            {years.map((year, index) => {
              const count = counts.get(year) ?? 0;
              const barHeight = count === 0 ? 0 : Math.max(3, (count / max) * (plotHeight - 4));
              const x = index * slot + (slot - barWidth) / 2;
              const active = isSelected(year);
              return (
                <g key={year}>
                  {count > 0 ? (
                    <path
                      d={barPath(x, plotHeight - barHeight, barWidth, barHeight)}
                      className={`density__bar${active ? ' density__bar--active' : ''}${
                        hasSelection && !active ? ' density__bar--dimmed' : ''
                      }`}
                    />
                  ) : (
                    <rect
                      x={x}
                      y={plotHeight - 2}
                      width={barWidth}
                      height={2}
                      className="density__empty"
                    />
                  )}
                  <rect
                    x={index * slot}
                    y={0}
                    width={Math.max(slot, 6)}
                    height={plotHeight}
                    className="density__hit"
                    onMouseEnter={() => setHovered(year)}
                    onMouseLeave={() => setHovered((current) => (current === year ? null : current))}
                    onClick={(event) => handleSelect(year, event.shiftKey)}
                  />
                </g>
              );
            })}
            {years
              .filter((year) => year % 10 === 0)
              .map((year) => {
                const index = years.indexOf(year);
                return (
                  <text
                    key={`tick-${year}`}
                    x={index * slot + slot / 2}
                    y={height - 3}
                    textAnchor="middle"
                    className="density__tick"
                  >
                    {year}
                  </text>
                );
              })}
          </svg>
        ) : null}
      </div>

      <div className="density__controls">
        <p className="density__hint subtle">
          Click a year to filter · shift-click a second year for a range
        </p>
        {hasSelection ? (
          <button type="button" className="density__clear" onClick={() => onSelect(null, null)}>
            Clear year filter
          </button>
        ) : null}
      </div>

      {/* Table view: the same numbers, available to screen readers and to
          anyone who cannot read the bars. */}
      <table className="sr-only">
        <caption>Catalogued entries per year</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Entries</th>
          </tr>
        </thead>
        <tbody>
          {histogram.map((bucket) => (
            <tr key={bucket.year}>
              <th scope="row">{bucket.year}</th>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
