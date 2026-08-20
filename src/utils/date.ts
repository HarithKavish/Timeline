import type { ClockTime, DatePrecision, Fact, PartialDate } from '../types/common';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/**
 * Renders a date at exactly the precision it is known to. A year-only date
 * renders as "1976" — never "1 January 1976".
 */
export function formatPartialDate(
  date: PartialDate | null,
  options: { short?: boolean } = {},
): string {
  if (!date) return 'Unknown';
  const months = options.short ? MONTHS_SHORT : MONTHS;
  if (date.month === undefined) return String(date.year);
  const month = months[date.month - 1] ?? '';
  if (date.day === undefined) return `${month} ${date.year}`;
  return `${date.day} ${month} ${date.year}`;
}

export function precisionOf(date: PartialDate | null): DatePrecision | null {
  if (!date) return null;
  if (date.day !== undefined) return 'day';
  if (date.month !== undefined) return 'month';
  return 'year';
}

export const PRECISION_LABEL: Record<DatePrecision, string> = {
  day: 'Day precision',
  month: 'Month precision',
  year: 'Year precision',
};

/**
 * A 24-hour wall clock rendering. Only ever called when a source states a time;
 * there is deliberately no default and no fallback value.
 */
export function formatClockTime(time: ClockTime | null): string {
  if (!time) return 'Unknown';
  const hh = String(time.hour).padStart(2, '0');
  const mm = String(time.minute).padStart(2, '0');
  return time.zone ? `${hh}:${mm} ${time.zone}` : `${hh}:${mm}`;
}

/**
 * Sortable numeric key. Missing month/day sort to the start of their period,
 * which orders the row without ever being displayed as a value.
 */
export function dateSortValue(date: PartialDate | null): number {
  if (!date) return Number.POSITIVE_INFINITY;
  return date.year * 10000 + (date.month ?? 1) * 100 + (date.day ?? 1);
}

export function yearOf(fact: Fact<PartialDate>): number | null {
  return fact.value ? fact.value.year : null;
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function decadeLabel(year: number): string {
  return `${decadeOf(year)}s`;
}

/** Inclusive year range as an array, e.g. 1976…1980. */
export function yearRange(from: number, to: number): number[] {
  const out: number[] = [];
  for (let year = from; year <= to; year += 1) out.push(year);
  return out;
}
