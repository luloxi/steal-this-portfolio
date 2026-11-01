import { isGrowableListKey } from "@/i18n/copy-overrides";
import { cache } from "react";
import { messages } from "@/i18n/messages";
import { flattenCopy, type CopyOverrides } from "@/i18n/copy-overrides";
import type { Locale } from "@/i18n/types";
import { getDb, nowIso, requireDb } from "@/lib/db";

const known: Record<Locale, Record<string, string>> = {
  es: flattenCopy(messages.es),
  en: flattenCopy(messages.en),
};

/** Per isolate. React cache() only dedupes within one request. */
const COPY_TTL_MS = 60_000;
let copyCache: { value: CopyOverrides; at: number } | null = null;
/** Bumped on write so an in-flight read cannot store a value from before the write. */
let copyEpoch = 0;

export function isKnownCopyKey(key: string, locale: string): locale is Locale {
  if (locale !== "es" && locale !== "en") return false;
  if (key in known[locale]) return true;
  return isGrowableListKey(key, known[locale]);
}

/** D1 site_copy rows that differ from the code defaults (code is the fallback). */
export const getCopyOverrides = cache(async (): Promise<CopyOverrides> => {
  const hit = copyCache;
  if (hit && Date.now() - hit.at < COPY_TTL_MS) return hit.value;

  const epoch = copyEpoch;
  const out: CopyOverrides = {};
  try {
    const db = await getDb();
    if (!db) return out;
    const { results } = await db
      .prepare("SELECT key, locale, value FROM site_copy")
      .all<{ key: string; locale: string; value: string }>();
    for (const r of results) {
      if (!isKnownCopyKey(r.key, r.locale)) continue;
      if (known[r.locale][r.key] === r.value) continue;
      (out[r.locale] ??= {})[r.key] = r.value;
    }
    if (epoch === copyEpoch) copyCache = { value: out, at: Date.now() };
  } catch (err) {
    console.error("[copy] overrides fallback to code:", err);
  }
  return out;
});

export async function setCopy(key: string, locale: Locale, value: string) {
  const db = await requireDb();
  await db
    .prepare(
      `INSERT INTO site_copy (key, locale, value, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (key, locale) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(key, locale, value, nowIso())
    .run();
  copyEpoch += 1;
  copyCache = null;
}
