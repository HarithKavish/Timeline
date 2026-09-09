import { DEVELOPING_WINDOW_HOURS } from './cluster';
import { OUTLETS, outletById } from './outlets';
import type {
  Env,
  PublicArticle,
  PublicOutlet,
  PublicThreadEntry,
  PublicTopic,
  PublicTopicDetail,
  TopicsResponse,
  TopicStatus,
} from './types';

const ALLOWED_ORIGINS = new Set([
  'https://timeline.harithkavish.com',
  'http://localhost:5173',
  'http://localhost:4173',
]);

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://timeline.harithkavish.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(data: unknown, headers: HeadersInit, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}

function statusOf(lastUpdatedAt: string, now: number): TopicStatus {
  const hours = (now - new Date(lastUpdatedAt).getTime()) / 3_600_000;
  return hours <= DEVELOPING_WINDOW_HOURS ? 'developing' : 'settled';
}

function toPublicOutlet(outlet: (typeof OUTLETS)[number]): PublicOutlet {
  return { id: outlet.id, name: outlet.name, homepage: outlet.homepage, region: outlet.region };
}

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, headers, 405);

  const url = new URL(request.url);

  if (url.pathname === '/outlets') {
    return json(OUTLETS.map(toPublicOutlet), headers);
  }

  const topicMatch = url.pathname.match(/^\/topics\/([^/]+)$/);
  if (topicMatch) {
    return getTopicDetail(env.DB, topicMatch[1]!, headers);
  }

  if (url.pathname === '/topics') {
    return listTopics(env.DB, url.searchParams, headers);
  }

  return json({ error: 'Not found' }, headers, 404);
}

async function listTopics(db: D1Database, params: URLSearchParams, headers: HeadersInit): Promise<Response> {
  const limit = clamp(Number(params.get('limit')) || 30, 1, 100);
  const offset = Math.max(0, Number(params.get('offset')) || 0);
  const sort = params.get('sort') === 'oldest' ? 'ASC' : 'DESC';
  const statusFilter = params.get('status');
  const outletFilter = params.get('outletId');
  const q = params.get('q')?.trim();
  const from = params.get('from');
  const to = params.get('to');

  const conditions: string[] = [];
  const binds: unknown[] = [];

  if (q) {
    conditions.push('t.title LIKE ?');
    binds.push(`%${q}%`);
  }
  if (from) {
    conditions.push('t.last_updated_at >= ?');
    binds.push(from);
  }
  if (to) {
    conditions.push('t.first_seen_at <= ?');
    binds.push(to);
  }
  if (outletFilter) {
    conditions.push('EXISTS (SELECT 1 FROM articles a WHERE a.topic_id = t.id AND a.outlet_id = ?)');
    binds.push(outletFilter);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const baseQuery = `
    SELECT t.id, t.title, t.first_seen_at, t.last_updated_at,
      (SELECT COUNT(DISTINCT a.outlet_id) FROM articles a WHERE a.topic_id = t.id) AS outlet_count,
      (SELECT COUNT(*) FROM articles a WHERE a.topic_id = t.id) AS article_count,
      (SELECT COUNT(*) FROM thread_entries e WHERE e.topic_id = t.id) AS entry_count
    FROM topics t
    ${where}
  `;

  const [rows, countRow] = await Promise.all([
    db
      .prepare(`${baseQuery} ORDER BY t.last_updated_at ${sort} LIMIT ? OFFSET ?`)
      .bind(...binds, limit, offset)
      .all<{
        id: string;
        title: string;
        first_seen_at: string;
        last_updated_at: string;
        outlet_count: number;
        article_count: number;
        entry_count: number;
      }>(),
    db
      .prepare(`SELECT COUNT(*) AS total FROM topics t ${where}`)
      .bind(...binds)
      .first<{ total: number }>(),
  ]);

  const now = Date.now();
  let items: PublicTopic[] = rows.results.map((row) => ({
    id: row.id,
    title: row.title,
    firstSeenAt: row.first_seen_at,
    lastUpdatedAt: row.last_updated_at,
    outletCount: row.outlet_count,
    articleCount: row.article_count,
    entryCount: row.entry_count,
    status: statusOf(row.last_updated_at, now),
  }));

  if (statusFilter === 'developing' || statusFilter === 'settled') {
    items = items.filter((item) => item.status === statusFilter);
  }

  const response: TopicsResponse = {
    items,
    total: countRow?.total ?? items.length,
    offset,
    limit,
    outlets: OUTLETS.map(toPublicOutlet),
  };
  return json(response, headers);
}

async function getTopicDetail(db: D1Database, topicId: string, headers: HeadersInit): Promise<Response> {
  const topicRow = await db
    .prepare('SELECT id, title, first_seen_at, last_updated_at FROM topics WHERE id = ?')
    .bind(topicId)
    .first<{ id: string; title: string; first_seen_at: string; last_updated_at: string }>();
  if (!topicRow) return json({ error: 'Topic not found' }, headers, 404);

  const [entryRows, articleRows] = await Promise.all([
    db
      .prepare('SELECT id, occurred_at, headline FROM thread_entries WHERE topic_id = ? ORDER BY occurred_at ASC')
      .bind(topicId)
      .all<{ id: string; occurred_at: string; headline: string }>(),
    db
      .prepare(
        `SELECT id, outlet_id, thread_entry_id, title, url, published_at, fetched_at, summary
         FROM articles WHERE topic_id = ? ORDER BY published_at ASC`,
      )
      .bind(topicId)
      .all<{
        id: string;
        outlet_id: string;
        thread_entry_id: string;
        title: string;
        url: string;
        published_at: string;
        fetched_at: string;
        summary: string | null;
      }>(),
  ]);

  const articlesByEntry = new Map<string, PublicArticle[]>();
  const outletsUsed = new Set<string>();
  for (const row of articleRows.results) {
    const outlet = outletById.get(row.outlet_id);
    outletsUsed.add(row.outlet_id);
    const article: PublicArticle = {
      id: row.id,
      outletId: row.outlet_id,
      outletName: outlet?.name ?? row.outlet_id,
      title: row.title,
      url: row.url,
      publishedAt: row.published_at,
      fetchedAt: row.fetched_at,
      summary: row.summary,
    };
    const bucket = articlesByEntry.get(row.thread_entry_id) ?? [];
    bucket.push(article);
    articlesByEntry.set(row.thread_entry_id, bucket);
  }

  const thread: PublicThreadEntry[] = entryRows.results.map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    headline: row.headline,
    articles: (articlesByEntry.get(row.id) ?? []).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)),
  }));

  const now = Date.now();
  const detail: PublicTopicDetail = {
    id: topicRow.id,
    title: topicRow.title,
    firstSeenAt: topicRow.first_seen_at,
    lastUpdatedAt: topicRow.last_updated_at,
    outletCount: outletsUsed.size,
    articleCount: articleRows.results.length,
    entryCount: thread.length,
    status: statusOf(topicRow.last_updated_at, now),
    thread,
    outlets: [...outletsUsed].map((id) => outletById.get(id)).filter((o): o is (typeof OUTLETS)[number] => Boolean(o)).map(toPublicOutlet),
  };
  return json(detail, headers);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
