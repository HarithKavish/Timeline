-- Adds the geographic-category tier (international/national/state/city) to
-- an already-deployed database. Existing rows default to 'international',
-- which is correct for every topic and outlet ingested before this
-- migration — only international outlets existed until now.
ALTER TABLE outlets ADD COLUMN category TEXT NOT NULL DEFAULT 'international';
ALTER TABLE topics ADD COLUMN category TEXT NOT NULL DEFAULT 'international';

CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category, last_updated_at);
