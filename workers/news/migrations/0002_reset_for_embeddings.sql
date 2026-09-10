-- Clustering moved from hand-built term-frequency vectors to real semantic
-- embeddings (bge-m3, 1024-dim). The two representations are structurally
-- incompatible — `centroid_json`/`vector_json` rows written by the old
-- pipeline are sparse {term: weight} objects, not dense float arrays, and
-- can't be compared against a real embedding. This is ephemeral, actively-
-- refreshed news data (not an archive), so the practical fix is a reset
-- rather than a backfill: everything re-ingests within a few cron cycles,
-- now through the embedding pipeline. `outlets` is untouched — ensureOutlets
-- upserts it on every run regardless.
DELETE FROM articles;
DELETE FROM thread_entries;
DELETE FROM topics;
