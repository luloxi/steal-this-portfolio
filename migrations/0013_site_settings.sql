-- Site identity, socials and theme colors (src/lib/site-settings.ts).
-- Key/value. No rows = the neutral defaults in code.
-- Writes are INSERT ... ON CONFLICT DO UPDATE only. Nothing is deleted.
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY NOT NULL CHECK (length(key) BETWEEN 1 AND 80),
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
