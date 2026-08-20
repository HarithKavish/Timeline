import type { Source } from '../../types/common';
import { SOURCE_TYPE_LABEL } from '../../utils/format';
import { SourceIcon } from '../ui/Icon';
import './sources.css';

/**
 * The provenance panel.
 *
 * Every locator here is a placeholder in the `timeline-demo://` scheme. That is
 * deliberate: a catalogue that cannot yet cite must not look like one that can.
 */
export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        No source records are attached to this entry.
      </p>
    );
  }

  return (
    <ol className="source-list">
      {sources.map((source) => (
        <li
          key={source.id}
          className="source-card"
          id={`source-${source.id.replace(':', '-')}`}
        >
          <div className="source-card__head">
            <SourceIcon size={15} className="source-card__icon" />
            <h4 className="source-card__name">{source.name}</h4>
            <span className="chip">{SOURCE_TYPE_LABEL[source.type]}</span>
            <span className={`chip chip--status-${source.status}`}>
              {source.status === 'mock' ? 'Demo record' : source.status}
            </span>
          </div>

          <dl className="source-card__meta">
            <div>
              <dt>Supports</dt>
              <dd>{source.supports.join(' · ')}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>
                <ConfidenceMeter level={source.confidence} />
              </dd>
            </div>
            <div>
              <dt>Locator</dt>
              <dd className="mono source-card__url">{source.urlPlaceholder}</dd>
            </div>
            {source.retrievedAt ? (
              <div>
                <dt>Retrieved</dt>
                <dd className="mono">{source.retrievedAt}</dd>
              </div>
            ) : null}
          </dl>

          {source.note ? <p className="source-card__note muted">{source.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function ConfidenceMeter({ level }: { level: Source['confidence'] }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <span className="confidence" title={`${level} confidence`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`confidence__step${index < filled ? ' confidence__step--on' : ''}`}
        />
      ))}
      <span className="confidence__label">{level}</span>
    </span>
  );
}

/** Compact provenance indicator for dense rows: "3 sources". */
export function SourceCount({ count }: { count: number }) {
  return (
    <span className="source-count" title={`${count} source records support this entry`}>
      <SourceIcon size={12} />
      <span className="mono">{count}</span>
    </span>
  );
}
