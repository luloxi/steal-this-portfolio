-- Portfolio projects (src/lib/projects.ts). One row per project.
-- Additive: a new table, nothing renamed or dropped.
-- project_overrides and project_settings stay (older editors). The app reads
-- and writes this table instead. Hide sets visible = 0. Nothing is deleted.
-- No rows = the projects section is empty (no code seed).
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) BETWEEN 1 AND 40),
  position INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'disabled' CHECK (status IN ('live', 'disabled', 'archive')),
  icon_url TEXT NOT NULL DEFAULT '',
  github_url TEXT NOT NULL DEFAULT '',
  live_url TEXT NOT NULL DEFAULT '',
  title_es TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_es TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  paragraphs_es TEXT NOT NULL DEFAULT '[]',
  paragraphs_en TEXT NOT NULL DEFAULT '[]',
  awards_es TEXT NOT NULL DEFAULT '',
  awards_en TEXT NOT NULL DEFAULT '',
  disabled_reason_es TEXT NOT NULL DEFAULT '',
  disabled_reason_en TEXT NOT NULL DEFAULT '',
  team_json TEXT NOT NULL DEFAULT '[]',
  widget TEXT NOT NULL DEFAULT '' CHECK (widget IN ('', 'pet')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS projects_position ON projects (position);
