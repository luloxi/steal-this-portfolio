/**
 * Landing FAQ list (pure helpers, no D1/Next imports: used by the API, the
 * page, llms-full.txt and tests). Stored per language in D1 `landing_faq`
 * (migration 0017). With no stored list, the code FAQ plus any
 * landing.home.faq.items.* site_copy edits (PR #26 inline edits) is the list.
 */
import { applyCopy, type CopyMap } from "@/i18n/copy-overrides";
import { landingCopy } from "@/i18n/landing";
import type { Locale } from "@/i18n/types";

export type FaqItem = { q: string; a: string };

export const FAQ_MAX_ITEMS = 30;
export const FAQ_Q_MAX = 300;
export const FAQ_A_MAX = 3000;

/** Code FAQ with the per-key edits saved since inline editing shipped. */
export function seedFaq(locale: Locale, overrides: CopyMap | undefined): FaqItem[] {
  return applyCopy({ landing: landingCopy(locale) }, overrides).landing.home.faq.items.map(({ q, a }) => ({ q, a }));
}

const clean = (s: string) => s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();

export type FaqValidation = { ok: true; items: FaqItem[] } | { ok: false; error: string };

/** Body from the editor: 0..30 items, each with a non-empty question and answer. */
export function validateFaqItems(raw: unknown): FaqValidation {
  if (!Array.isArray(raw)) return { ok: false, error: "invalid_items" };
  if (raw.length > FAQ_MAX_ITEMS) return { ok: false, error: "too_many" };
  const items: FaqItem[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") return { ok: false, error: "invalid_item" };
    const { q, a } = it as Record<string, unknown>;
    if (typeof q !== "string" || typeof a !== "string") return { ok: false, error: "invalid_item" };
    const qq = clean(q).replace(/\s+/g, " ");
    const aa = clean(a);
    if (!qq || !aa) return { ok: false, error: "empty" };
    if (qq.length > FAQ_Q_MAX || aa.length > FAQ_A_MAX) return { ok: false, error: "too_long" };
    items.push({ q: qq, a: aa });
  }
  return { ok: true, items };
}

/** Stored JSON -> list; anything unreadable = null (the seed is used instead). */
export function parseStoredFaq(json: string | null | undefined): FaqItem[] | null {
  if (!json) return null;
  try {
    const v = validateFaqItems(JSON.parse(json));
    return v.ok ? v.items : null;
  } catch {
    return null;
  }
}

/** Plain text block for llms-full.txt. */
export function faqToText(items: readonly FaqItem[]): string {
  return items.map((it) => `Q: ${it.q}\nA: ${it.a}`).join("\n\n");
}
