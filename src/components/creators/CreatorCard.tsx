import { Link } from 'react-router-dom';
import type { CreatorSummary } from '../../types/api';
import type { YearBucket } from '../../types/api';
import { ROLE_LABEL } from '../../utils/format';
import './creators.css';

/**
 * A creator's output per year, drawn small. It is a shape, not a readable
 * chart — the numbers live on the creator page — so it carries no axis and no
 * labels, only the span beneath it.
 */
export function CareerRidge({
  histogram,
  span,
  height = 26,
}: {
  histogram: YearBucket[];
  span: { from: number; to: number };
  height?: number;
}) {
  if (histogram.length === 0 || span.to <= span.from) return null;

  const width = 120;
  const years = span.to - span.from + 1;
  const max = Math.max(...histogram.map((bucket) => bucket.count));
  const slot = width / years;
  const barWidth = Math.max(1.5, slot - 1.5);

  return (
    <svg
      className="ridge"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Output per year, ${span.from} to ${span.to}`}
    >
      {histogram.map((bucket) => {
        const barHeight = Math.max(2, (bucket.count / max) * (height - 2));
        return (
          <rect
            key={bucket.year}
            x={(bucket.year - span.from) * slot}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={1}
            className="ridge__bar"
          />
        );
      })}
    </svg>
  );
}

export function CreatorCard({ summary }: { summary: CreatorSummary }) {
  const { creator, activeSpan } = summary;
  const span =
    activeSpan.from !== null && activeSpan.to !== null
      ? { from: activeSpan.from, to: activeSpan.to }
      : null;

  return (
    <li className="creator-card">
      <Link to={`/music/creator/${creator.slug}`} className="creator-card__link">
        <div className="creator-card__head">
          <h3 className="creator-card__name display">{creator.name}</h3>
          {creator.nameNative ? (
            <p className="creator-card__native subtle">{creator.nameNative}</p>
          ) : null}
        </div>

        <p className="creator-card__roles">
          {summary.topRoles.length > 0
            ? summary.topRoles.slice(0, 3).map((role) => ROLE_LABEL[role]).join(' · ')
            : creator.roles.slice(0, 3).map((role) => ROLE_LABEL[role]).join(' · ')}
        </p>

        <div className="creator-card__foot">
          <span className="creator-card__span mono">
            {span ? (span.from === span.to ? span.from : `${span.from}–${span.to}`) : 'No dated works'}
          </span>
          <span className="creator-card__count mono">
            {summary.workCount} {summary.workCount === 1 ? 'work' : 'works'}
          </span>
        </div>

        {span && summary.histogram.length > 1 ? (
          <CareerRidge histogram={summary.histogram} span={span} />
        ) : (
          <span className="creator-card__ridge-placeholder" aria-hidden="true" />
        )}
      </Link>
    </li>
  );
}

export function CreatorGrid({ children }: { children: React.ReactNode }) {
  return <ul className="creator-grid">{children}</ul>;
}
