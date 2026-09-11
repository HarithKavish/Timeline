-- English translation of an article's title, for display, when the outlet's
-- own language isn't English. NULL for existing rows (all English so far —
-- District/City, the only non-English-capable tiers, have never
-- successfully ingested anything) and for any future row where translation
-- fails; callers fall back to `title` either way. `title` is never
-- overwritten.
ALTER TABLE articles ADD COLUMN title_en TEXT;
