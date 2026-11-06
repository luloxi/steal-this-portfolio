-- Private use is a flat US$ 100 in both modes (was 500 per project / 200 per hour).
-- Upsert so a site that already saved the old defaults picks up the new price.
INSERT INTO pricing_settings (key, value, updated_at) VALUES
  ('private_project', 100, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('private_hourly', 100, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = excluded.updated_at;
