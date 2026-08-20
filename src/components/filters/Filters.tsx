import { useEffect, useId, useState } from 'react';
import type { FilterController, MultiFilterKey } from '../../hooks/useTimelineFilters';
import { useScrollLock } from '../../hooks/useMediaQuery';
import {
  CLASSIFICATION_LABEL,
  CONTEXT_LABEL,
  DURATION_BUCKETS,
  FILTERABLE_ROLES,
  LANGUAGES,
  MUSIC_TYPE_LABEL,
  RELEASE_TYPE_LABEL,
  ROLE_LABEL,
} from '../../utils/format';
import { ArrowDownIcon, ArrowUpIcon, CloseIcon, FilterIcon } from '../ui/Icon';
import type {
  MusicType,
  ProductionContext,
  ReleaseClassification,
  ReleaseType,
} from '../../types/music';
import './filters.css';

/* ---- Option group ------------------------------------------------------ */

function OptionGroup({
  title,
  filterKey,
  options,
  controller,
  note,
}: {
  title: string;
  filterKey: MultiFilterKey;
  options: Array<{ value: string; label: string; disabled?: boolean; hint?: string }>;
  controller: FilterController;
  note?: string;
}) {
  return (
    <fieldset className="filter-group">
      <legend className="filter-group__legend">{title}</legend>
      <div className="filter-group__options">
        {options.map((option) => {
          const active = controller.isActive(filterKey, option.value);
          return (
            <button
              key={option.value}
              type="button"
              className="filter-option"
              aria-pressed={active}
              disabled={option.disabled}
              title={option.hint}
              onClick={() => controller.toggle(filterKey, option.value)}
            >
              <span className="filter-option__box" aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      {note ? <p className="filter-group__note subtle">{note}</p> : null}
    </fieldset>
  );
}

/* ---- Year range -------------------------------------------------------- */

function YearRange({
  controller,
  span,
}: {
  controller: FilterController;
  span: { from: number; to: number };
}) {
  const fromId = useId();
  const toId = useId();
  const { yearFrom, yearTo } = controller.state;
  const [draft, setDraft] = useState({
    from: yearFrom === null ? '' : String(yearFrom),
    to: yearTo === null ? '' : String(yearTo),
  });

  useEffect(() => {
    setDraft({
      from: yearFrom === null ? '' : String(yearFrom),
      to: yearTo === null ? '' : String(yearTo),
    });
  }, [yearFrom, yearTo]);

  const commit = (next: { from: string; to: string }) => {
    const parse = (value: string) => {
      const year = Number.parseInt(value, 10);
      return Number.isFinite(year) ? year : null;
    };
    controller.setYearRange(parse(next.from), parse(next.to));
  };

  return (
    <fieldset className="filter-group">
      <legend className="filter-group__legend">Years</legend>
      <div className="year-range">
        <label className="year-range__field" htmlFor={fromId}>
          <span className="subtle">From</span>
          <input
            id={fromId}
            type="number"
            inputMode="numeric"
            className="mono"
            placeholder={String(span.from)}
            min={span.from}
            max={span.to}
            value={draft.from}
            onChange={(event) => setDraft((d) => ({ ...d, from: event.target.value }))}
            onBlur={() => commit(draft)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit(draft);
            }}
          />
        </label>
        <span className="year-range__dash" aria-hidden="true">
          –
        </span>
        <label className="year-range__field" htmlFor={toId}>
          <span className="subtle">To</span>
          <input
            id={toId}
            type="number"
            inputMode="numeric"
            className="mono"
            placeholder={String(span.to)}
            min={span.from}
            max={span.to}
            value={draft.to}
            onChange={(event) => setDraft((d) => ({ ...d, to: event.target.value }))}
            onBlur={() => commit(draft)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit(draft);
            }}
          />
        </label>
      </div>
      <p className="filter-group__note subtle">
        Catalogue spans {span.from}–{span.to}.
      </p>
    </fieldset>
  );
}

/* ---- Text filter -------------------------------------------------------- */

function TextFilter({ controller }: { controller: FilterController }) {
  const fieldId = useId();
  const [draft, setDraft] = useState(controller.state.q);

  useEffect(() => {
    setDraft(controller.state.q);
  }, [controller.state.q]);

  return (
    <fieldset className="filter-group">
      <legend className="filter-group__legend">Within these entries</legend>
      <label className="sr-only" htmlFor={fieldId}>
        Filter entries by title, film, release or creator
      </label>
      <input
        id={fieldId}
        type="search"
        className="creators-search"
        style={{ maxWidth: 'none', width: '100%' }}
        placeholder="Title, film, release, creator…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => controller.setQ(draft)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') controller.setQ(draft);
        }}
      />
      <p className="filter-group__note subtle">
        Narrows the current result set. For catalogue-wide search, press <kbd>/</kbd>.
      </p>
    </fieldset>
  );
}

/* ---- The full filter body ---------------------------------------------- */

export function FilterBody({
  controller,
  span,
}: {
  controller: FilterController;
  span: { from: number; to: number };
}) {
  return (
    <div className="filter-body">
      <TextFilter controller={controller} />

      <YearRange controller={controller} span={span} />

      <OptionGroup
        title="Release type"
        filterKey="releaseTypes"
        controller={controller}
        options={(Object.keys(RELEASE_TYPE_LABEL) as ReleaseType[]).map((value) => ({
          value,
          label: RELEASE_TYPE_LABEL[value],
        }))}
      />

      <OptionGroup
        title="Classification"
        filterKey="classifications"
        controller={controller}
        options={(Object.keys(CLASSIFICATION_LABEL) as ReleaseClassification[]).map((value) => ({
          value,
          label: CLASSIFICATION_LABEL[value],
        }))}
      />

      <OptionGroup
        title="Production context"
        filterKey="contexts"
        controller={controller}
        options={(Object.keys(CONTEXT_LABEL) as ProductionContext[]).map((value) => ({
          value,
          label: CONTEXT_LABEL[value],
        }))}
        note="Whether the music was written for a film or stands on its own."
      />

      <OptionGroup
        title="Music type"
        filterKey="musicTypes"
        controller={controller}
        options={(Object.keys(MUSIC_TYPE_LABEL) as MusicType[]).map((value) => ({
          value,
          label: MUSIC_TYPE_LABEL[value],
        }))}
      />

      <OptionGroup
        title="Duration"
        filterKey="durationBuckets"
        controller={controller}
        options={DURATION_BUCKETS.map((bucket) => ({ value: bucket.id, label: bucket.label }))}
        note="Entries with no recorded duration are excluded when a duration filter is on."
      />

      <OptionGroup
        title="Language"
        filterKey="languages"
        controller={controller}
        options={LANGUAGES.map((language) => ({
          value: language.code,
          label: language.endonym ? `${language.label} · ${language.endonym}` : language.label,
          disabled: !language.available,
          hint: language.available ? undefined : 'No catalogue data in this build yet',
        }))}
        note="Tamil is the first catalogued language; the others are declared so the filter does not need rebuilding."
      />

      <OptionGroup
        title="Credited role"
        filterKey="roles"
        controller={controller}
        options={FILTERABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }))}
        note="Keeps entries carrying at least one credit in the chosen role."
      />

      <fieldset className="filter-group">
        <legend className="filter-group__legend">Appearances</legend>
        <button
          type="button"
          className="filter-option"
          aria-pressed={controller.state.includeSubsequentReleases}
          onClick={() =>
            controller.setIncludeSubsequent(!controller.state.includeSubsequentReleases)
          }
        >
          <span className="filter-option__box" aria-hidden="true" />
          <span>Include later releases</span>
        </button>
        <p className="filter-group__note subtle">
          Off by default, so a recording is counted once at its first publication. Turn on to
          see compilation and reissue appearances of the same recording.
        </p>
      </fieldset>
    </div>
  );
}

/* ---- Active filter chips ----------------------------------------------- */

export function ActiveFilters({ controller }: { controller: FilterController }) {
  if (controller.activeFilters.length === 0) return null;

  return (
    <div className="active-filters">
      <span className="eyebrow">Active</span>
      <ul className="active-filters__list">
        {controller.activeFilters.map((filter) => (
          <li key={filter.id}>
            <button
              type="button"
              className="active-filter"
              onClick={filter.remove}
              aria-label={`Remove filter ${filter.group}: ${filter.label}`}
            >
              <span className="active-filter__group">{filter.group}</span>
              <span className="active-filter__value">{filter.label}</span>
              <CloseIcon size={12} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="active-filters__clear" onClick={controller.clearAll}>
        Clear all
      </button>
    </div>
  );
}

/* ---- Sort toggle -------------------------------------------------------- */

export function SortToggle({ controller }: { controller: FilterController }) {
  const ascending = controller.state.sort === 'asc';
  return (
    <button
      type="button"
      className="sort-toggle"
      onClick={() => controller.setSort(ascending ? 'desc' : 'asc')}
      title="Switch chronological direction"
    >
      {ascending ? <ArrowDownIcon size={14} /> : <ArrowUpIcon size={14} />}
      <span>{ascending ? 'Earliest first' : 'Latest first'}</span>
    </button>
  );
}

/* ---- Desktop panel / mobile sheet --------------------------------------- */

export function FilterPanel({
  controller,
  span,
}: {
  controller: FilterController;
  span: { from: number; to: number };
}) {
  return (
    <aside className="filter-panel" aria-label="Filters">
      <div className="filter-panel__head">
        <h2 className="filter-panel__title">Filters</h2>
        {controller.activeCount > 0 ? (
          <button type="button" className="filter-panel__clear" onClick={controller.clearAll}>
            Clear all
          </button>
        ) : null}
      </div>
      <FilterBody controller={controller} span={span} />
    </aside>
  );
}

export function FilterSheetTrigger({
  controller,
  span,
}: {
  controller: FilterController;
  span: { from: number; to: number };
}) {
  const [open, setOpen] = useState(false);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="filter-trigger" onClick={() => setOpen(true)}>
        <FilterIcon size={15} />
        <span>Filters</span>
        {controller.activeCount > 0 ? (
          <span className="filter-trigger__count mono">{controller.activeCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="sheet__scrim"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <div className="sheet__panel">
            <header className="sheet__head">
              <h2 className="sheet__title">Filters</h2>
              <div className="sheet__head-actions">
                {controller.activeCount > 0 ? (
                  <button type="button" className="sheet__clear" onClick={controller.clearAll}>
                    Clear all
                  </button>
                ) : null}
                <button
                  type="button"
                  className="sheet__close"
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            </header>
            <div className="sheet__body">
              <FilterBody controller={controller} span={span} />
            </div>
            <footer className="sheet__foot">
              <button type="button" className="button button--primary" onClick={() => setOpen(false)}>
                Show results
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
