-- Landing FAQ (preguntas frecuentes), one row per language: items = JSON
-- array of {"q","a"} in display order. No row = the FAQ in code
-- (src/content/home-copy.ts) with any landing.home.faq.items.* site_copy edits.
-- Writes are INSERT ... ON CONFLICT DO UPDATE only.
CREATE TABLE IF NOT EXISTS landing_faq (
  locale TEXT PRIMARY KEY NOT NULL CHECK (locale IN ('es', 'en')),
  items TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
