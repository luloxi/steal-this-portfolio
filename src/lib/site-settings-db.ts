/**
 * D1 side of site identity (migrations/0013_site_settings.sql).
 * Reads never throw. Writes are INSERT ... ON CONFLICT DO UPDATE only.
 * A successful read is cached on this isolate for 60s. The error fallback is not.
 */
import { cache } from "react";
import { getDb, nowIso, type D1Database } from "@/lib/db";
import { DEFAULT_SITE, settingsFromRows, type SiteSettings } from "@/lib/site-settings";

/** Per isolate. React cache() only dedupes within one request. One value, no key. */
const SETTINGS_TTL_MS = 60_000;
let settingsCache: { value: SiteSettings; at: number } | null = null;
/** Bumped on write so an in-flight read cannot store a value from before the write. */
let settingsEpoch = 0;

export async function loadSiteSettings(db: D1Database | null): Promise<SiteSettings> {
  if (!db) return settingsFromRows([]);
  const hit = settingsCache;
  if (hit && Date.now() - hit.at < SETTINGS_TTL_MS) return hit.value;
  const epoch = settingsEpoch;
  try {
    const { results } = await db.prepare("SELECT key, value FROM site_settings").all<{ key: string; value: string }>();
    const value = settingsFromRows(results);
    if (epoch === settingsEpoch) settingsCache = { value, at: Date.now() };
    return value;
  } catch (err) {
    console.error("[site-settings] fallback to defaults:", err);
    return settingsFromRows([]);
  }
}

export const getSiteSettings = cache(async () => loadSiteSettings(await getDb()));

export async function saveSiteSettings(db: D1Database, entries: readonly { key: string; value: string }[]): Promise<void> {
  const now = nowIso();
  await db.batch(
    entries.map((e) =>
      db
        .prepare(
          `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        )
        .bind(e.key, e.value, now),
    ),
  );
  settingsEpoch += 1;
  settingsCache = null;
}

export { DEFAULT_SITE };
