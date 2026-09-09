import { XMLParser } from 'fast-xml-parser';
import type { FeedItem } from './types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

/** Parses RSS 2.0 or Atom into a flat item list. Unknown shapes yield []. */
export function parseFeed(xml: string): FeedItem[] {
  let doc: unknown;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }
  const root = doc as Record<string, unknown>;

  const rss = root.rss as { channel?: Record<string, unknown> } | undefined;
  if (rss?.channel) {
    return toArray(rss.channel.item)
      .map((item) => {
        const record = item as Record<string, unknown>;
        const link = typeof record.link === 'string' ? record.link : hrefOf(record.link);
        return {
          title: cleanText(record.title),
          link,
          summary: record.description ? stripHtml(cleanText(record.description)) : null,
          publishedAt: parseDate(record.pubDate),
        };
      })
      .filter((item): item is FeedItem => Boolean(item.title && item.link));
  }

  const feed = root.feed as { entry?: unknown } | undefined;
  if (feed?.entry) {
    return toArray(feed.entry)
      .map((entry) => {
        const record = entry as Record<string, unknown>;
        const link = hrefOf(record.link);
        const summarySource = record.summary ?? record.content;
        return {
          title: cleanText(record.title),
          link,
          summary: summarySource ? stripHtml(cleanText(summarySource)) : null,
          publishedAt: parseDate(record.published ?? record.updated),
        };
      })
      .filter((item): item is FeedItem => Boolean(item.title && item.link));
  }

  return [];
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Atom `<link href="…"/>` may be a single object or an array with rel variants. */
function hrefOf(value: unknown): string {
  if (!value) return '';
  const candidates = Array.isArray(value) ? value : [value];
  for (const candidate of candidates) {
    if (typeof candidate !== 'object' || candidate === null) continue;
    const record = candidate as Record<string, unknown>;
    const rel = record['@_rel'];
    const href = record['@_href'];
    if (typeof href === 'string' && (rel === undefined || rel === 'alternate')) return href;
  }
  const first = candidates[0];
  if (first && typeof first === 'object') {
    const href = (first as Record<string, unknown>)['@_href'];
    if (typeof href === 'string') return href;
  }
  return '';
}

function cleanText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && '#text' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)['#text']).trim();
  }
  return '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

function parseDate(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
