-- Timeline News — D1 schema.
--
-- A `topic` is a cluster of articles judged to report the same real-world
-- story. Its `thread_entries` are the distinct developments within that
-- story, chronological. Each entry carries every article — from whichever
-- outlets — judged to be reporting *that same development* rather than a
-- new one; that is the corroboration/dedup layer.

CREATE TABLE IF NOT EXISTS outlets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  homepage TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  region TEXT NOT NULL,
  -- 'international' | 'national' | 'state' | 'city'
  category TEXT NOT NULL DEFAULT 'international'
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'international',
  first_seen_at TEXT NOT NULL,
  last_updated_at TEXT NOT NULL,
  -- Recency-weighted centroid of every thread entry's embedding, as a JSON
  -- array of floats (bge-m3, 1024-dim). Recomputed after every article that
  -- joins this topic. Column kept its name across the embeddings migration
  -- (0002) — only what's stored in it changed.
  centroid_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS thread_entries (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id),
  occurred_at TEXT NOT NULL,
  headline TEXT NOT NULL,
  -- This entry's own embedding (not the topic's), used to tell a genuinely
  -- new development apart from another outlet corroborating this one.
  vector_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY, -- sha256(canonical url), truncated
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  thread_entry_id TEXT NOT NULL REFERENCES thread_entries(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_topics_last_updated ON topics(last_updated_at);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category, last_updated_at);
CREATE INDEX IF NOT EXISTS idx_thread_entries_topic ON thread_entries(topic_id);
CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic_id);
CREATE INDEX IF NOT EXISTS idx_articles_thread_entry ON articles(thread_entry_id);
CREATE INDEX IF NOT EXISTS idx_articles_outlet ON articles(outlet_id);
