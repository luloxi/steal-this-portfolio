import { isGrowableListKey } from "@/i18n/copy-overrides";
import { cache } from "react";
import { messages } from "@/i18n/messages";
import { landingCopy } from "@/i18n/landing";
import { flattenCopy, type CopyOverrides } from "@/i18n/copy-overrides";
import type { Locale } from "@/i18n/types";
import { getDb, nowIso, requireDb } from "@/lib/db";

/** Editable keys: the messages tree plus the landing texts under "landing.". */
const known: Record<Locale, Record<string, string>> = {
  es: flattenCopy({ ...messages.es, landing: landingCopy("es") }),
  en: flattenCopy({ ...messages.en, landing: landingCopy("en") }),
};

/**
 * Per isolate. React cache() only dedupes within one request. Kept on
 * globalThis: the API route and the pages can be separate module instances
 * in one isolate, and a save must clear the cache the pages read.
 */
const COPY_TTL_MS = 60_000;
type CopyCacheState = { value: CopyOverrides; at: number } | null;
const store = globalThis as typeof globalThis & { __luloxCopy?: { cache: CopyCacheState; epoch: number } };
const shared = (store.__luloxCopy ??= { cache: null, epoch: 0 });

export function isKnownCopyKey(key: string, locale: string): locale is Locale {
  if (locale !== "es" && locale !== "en") return false;
  if (key in known[locale]) return true;
  return isGrowableListKey(key, known[locale]);
}

/**
 * D1 site_copy rows that differ from the code defaults (code is the fallback).
 * fresh: skip the isolate cache (the owner always reads what is in D1, so an
 * edit or a reorder never starts from text that is up to a minute old).
 */
export const getCopyOverrides = cache(async (fresh = false): Promise<CopyOverrides> => {
  const hit = shared.cache;
  if (!fresh && hit && Date.now() - hit.at < COPY_TTL_MS) return hit.value;

  const epoch = shared.epoch;
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
    if (epoch === shared.epoch) shared.cache = { value: out, at: Date.now() };
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
  shared.epoch += 1;
  shared.cache = null;
}
