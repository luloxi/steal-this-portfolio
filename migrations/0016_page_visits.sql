-- Cookieless first-party page visits. No IP, no user agent, no cookies.
-- day is YYYY-MM-DD in America/Argentina/Buenos_Aires.
CREATE TABLE IF NOT EXISTS page_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visited_at TEXT NOT NULL,
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer_host TEXT,
  country TEXT,
  source TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS page_visits_day ON page_visits (day);
CREATE INDEX IF NOT EXISTS page_visits_source ON page_visits (source);
CREATE INDEX IF NOT EXISTS page_visits_path ON page_visits (path);
CREATE INDEX IF NOT EXISTS page_visits_utm_source ON page_visits (utm_source);
