/**
 * D1 side of site identity (migrations/0013_site_settings.sql).
 * Reads never throw. Writes are INSERT ... ON CONFLICT DO UPDATE only.
 */
import { cache } from "react";
import { getDb, nowIso, type D1Database } from "@/lib/db";
import { DEFAULT_SITE, settingsFromRows, type SiteSettings } from "@/lib/site-settings";

export async function loadSiteSettings(db: D1Database | null): Promise<SiteSettings> {
  if (!db) return settingsFromRows([]);
  try {
    const { results } = await db.prepare("SELECT key, value FROM site_settings").all<{ key: string; value: string }>();
    return settingsFromRows(results);
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
}

export { DEFAULT_SITE };
