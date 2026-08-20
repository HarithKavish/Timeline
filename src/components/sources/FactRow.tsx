import type { ReactNode } from 'react';
import type { Certainty, EntityId, Fact, Source } from '../../types/common';
import { CERTAINTY_DESCRIPTION, CERTAINTY_LABEL } from '../../utils/format';
import './sources.css';

/**
 * The certainty badge is the smallest unit of Timeline's promise: a value is
 * never shown without saying how well it is established.
 */
export function CertaintyBadge({ certainty }: { certainty: Certainty }) {
  const tone =
    certainty === 'known'
      ? 'known'
      : certainty === 'unknown'
        ? 'unknown'
        : certainty === 'partial'
          ? 'unknown'
          : 'reported';
  return (
    <span
      className={`certainty certainty--${tone}`}
      title={CERTAINTY_DESCRIPTION[certainty]}
    >
      {CERTAINTY_LABEL[certainty]}
    </span>
  );
}

export function SourceRefs({
  sourceIds,
  sources,
}: {
  sourceIds: EntityId[];
  sources: Source[];
}) {
  if (sourceIds.length === 0) return null;
  const resolved = sourceIds
    .map((id) => sources.find((source) => source.id === id))
    .filter((source): source is Source => Boolean(source));
  if (resolved.length === 0) return null;

  return (
    <span className="source-refs">
      {resolved.map((source) => (
        <a
          key={source.id}
          className="source-ref mono"
          href={`#source-${source.id.replace(':', '-')}`}
          title={`${source.name} — supports: ${source.supports.join(', ')}`}
        >
          {shortLabel(source)}
        </a>
      ))}
    </span>
  );
}

function shortLabel(source: Source): string {
  switch (source.type) {
    case 'database':
      return 'DB';
    case 'label':
      return 'LBL';
    case 'creator':
      return 'CRT';
    case 'streaming':
      return 'STR';
    case 'press':
      return 'PRS';
    case 'archive':
      return 'ARC';
    default:
      return 'SRC';
  }
}

interface FactRowProps<T> {
  label: string;
  fact: Fact<T>;
  /** Renders a present value. Never called when the value is null. */
  render: (value: T) => ReactNode;
  sources: Source[];
  /** Shown in place of "Unknown" when the value is absent. */
  unknownLabel?: string;
}

/**
 * One catalogued fact: label, value (or an explicit Unknown), how well it is
 * established, and which source records support it.
 */
export function FactRow<T>({ label, fact, render, sources, unknownLabel }: FactRowProps<T>) {
  const isUnknown = fact.value === null;
  return (
    <div className="fact">
      <dt className="fact__label">{label}</dt>
      <dd className="fact__value">
        <span className={isUnknown ? 'fact__unknown' : 'fact__known'}>
          {isUnknown ? (unknownLabel ?? 'Unknown') : render(fact.value as T)}
        </span>
        <CertaintyBadge certainty={fact.certainty} />
        <SourceRefs sourceIds={fact.sourceIds} sources={sources} />
        {fact.note ? <span className="fact__note subtle">{fact.note}</span> : null}
      </dd>
    </div>
  );
}

export function FactList({ children }: { children: ReactNode }) {
  return <dl className="fact-list">{children}</dl>;
}

/** A plain label/value pair for values that are structural, not sourced. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <dt className="fact__label">{label}</dt>
      <dd className="fact__value">
        <span className="fact__known">{children}</span>
      </dd>
    </div>
  );
}
