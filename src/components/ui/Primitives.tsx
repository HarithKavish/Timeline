import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './ui.css';

/* ---- Chips ------------------------------------------------------------ */

export type ChipTone = 'neutral' | 'film' | 'independent' | 'accent';

export function Chip({
  children,
  tone = 'neutral',
  title,
}: {
  children: ReactNode;
  tone?: ChipTone;
  title?: string;
}) {
  return (
    <span className={`chip chip--${tone}`} {...(title ? { title } : {})}>
      {children}
    </span>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <span className="chip-row">{children}</span>;
}

/* ---- Section ---------------------------------------------------------- */

export function Section({
  title,
  eyebrow,
  description,
  action,
  children,
  id,
}: {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="section" {...(id ? { id } : {})}>
      <header className="section__head">
        <div className="section__headings">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="section__title display">{title}</h2>
          {description ? <p className="section__desc muted">{description}</p> : null}
        </div>
        {action ? <div className="section__action">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

/* ---- Stats ------------------------------------------------------------ */

export function StatGrid({ children }: { children: ReactNode }) {
  return <dl className="stat-grid">{children}</dl>;
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="stat">
      <dt className="stat__label">{label}</dt>
      <dd className="stat__value mono">{value}</dd>
      {hint ? <dd className="stat__hint subtle">{hint}</dd> : null}
    </div>
  );
}

/* ---- Loading & empty states ------------------------------------------- */

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="skeleton__line" style={{ width: `${88 - index * 9}%` }} />
      ))}
    </div>
  );
}

export function LoadingState({ label = 'Loading catalogue…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <Skeleton lines={4} />
      <p className="sr-only">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="state state--empty">
      <p className="state__title display">{title}</p>
      {children ? <p className="state__body muted">{children}</p> : null}
      {action ? <div className="state__action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title display">This entry is not in the catalogue</p>
      <p className="state__body muted">{error.message}</p>
      <div className="state__action">
        <Link className="button" to="/music/timeline">
          Back to the timeline
        </Link>
      </div>
    </div>
  );
}

/* ---- Buttons ---------------------------------------------------------- */

export function Button({
  children,
  onClick,
  variant = 'default',
  type = 'button',
  ariaLabel,
  pressed,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'ghost' | 'primary';
  type?: 'button' | 'submit';
  ariaLabel?: string;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      {...(pressed !== undefined ? { 'aria-pressed': pressed } : {})}
    >
      {children}
    </button>
  );
}

/* ---- Demo-data notice -------------------------------------------------- */

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="demo-notice demo-notice--compact">
        <span className="demo-notice__tag mono">DEMO DATA</span>
        <span>
          Illustrative catalogue. Titles are real; dates, durations, credits and every source
          record are placeholders.
        </span>
      </p>
    );
  }
  return (
    <aside className="demo-notice" aria-label="Data status">
      <span className="demo-notice__tag mono">DEMO DATA</span>
      <p>
        This build runs entirely on a demonstration dataset. Work, film and creator names are
        real, but dates, durations, credits and <strong>all source records are placeholders</strong>
        {' '}— nothing here was retrieved from the organisations named, and no locator is a real
        URL. Source-backed ingestion is a later stage.
      </p>
    </aside>
  );
}
