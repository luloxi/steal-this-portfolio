import type { Locale } from "@/i18n/types";
import { getDb, nowIso, requireDb } from "@/lib/db";
import { parseStoredFaq, seedFaq, type FaqItem } from "@/lib/faq";
import { getCopyOverrides } from "@/lib/site-copy";

/**
 * The landing FAQ for one language: the saved list (one row by primary key,
 * read on every request so a save shows right away), else the seed.
 */
export async function getFaq(locale: Locale): Promise<FaqItem[]> {
  try {
    const db = await getDb();
    if (db) {
      const row = await db.prepare("SELECT items FROM landing_faq WHERE locale = ?").bind(locale).first<{ items: string }>();
      const saved = parseStoredFaq(row?.items);
      if (saved) return saved;
    }
  } catch (err) {
    console.error("[faq] fallback to seed:", err);
  }
  return seedFaq(locale, (await getCopyOverrides())[locale]);
}

export async function saveFaq(locale: Locale, items: FaqItem[]): Promise<void> {
  const db = await requireDb();
  await db
    .prepare(
      `INSERT INTO landing_faq (locale, items, updated_at) VALUES (?, ?, ?)
       ON CONFLICT (locale) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at`,
    )
    .bind(locale, JSON.stringify(items), nowIso())
    .run();
}
