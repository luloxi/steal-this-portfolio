/**
 * Business amounts the admin can change from /contratar (edit mode), stored in
 * D1 `pricing_settings` (migrations/0010_pricing_settings.sql) as key/value
 * integers. Pure and shared by client and server:
 *  - PRICING_FIELDS: the editable keys and their bounds.
 *  - validatePricingPayload: strict check for the save API (all keys, whole numbers, in bounds).
 *  - mergeStoredPricing: stored rows -> Pricing, falling back to the code default per field.
 * Hours-per-day limit, project day cap (1..20), size thresholds (20/30/40 h), urgency/on-site day caps and validity stay in code.
 */
import { PRICING, type Pricing } from "./pricing";

export const PRICING_FIELDS = [
  { key: "rate_low", max: 1000 },
  { key: "rate_medium", max: 1000 },
  { key: "rate_high", max: 1000 },
  { key: "on_site", max: 10000 },
  { key: "travel", max: 10000 },
  { key: "urgency", max: 10000 },
  { key: "private_project", max: 100000 },
  { key: "private_hourly", max: 100000 },
  { key: "deposit_pct", max: 100 },
  { key: "discount_s", max: 90 },
  { key: "discount_m", max: 90 },
  { key: "discount_l", max: 90 },
] as const;

export type PricingKey = (typeof PRICING_FIELDS)[number]["key"];
export type PricingValues = Record<PricingKey, number>;

const MAX = Object.fromEntries(PRICING_FIELDS.map((f) => [f.key, f.max])) as Record<PricingKey, number>;
const KEYS = PRICING_FIELDS.map((f) => f.key) as PricingKey[];

const isKey = (k: string): k is PricingKey => k in MAX;
/** Whole number (a JS number, not a string), 0..max for the field. */
export const isValidAmount = (key: PricingKey, v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX[key];
export const maxFor = (key: PricingKey) => MAX[key];

/** Size discounts must not shrink as the project grows: Chico <= Mediano <= Grande. */
export const discountsCoherent = (v: Pick<PricingValues, "discount_s" | "discount_m" | "discount_l">) =>
  v.discount_s <= v.discount_m && v.discount_m <= v.discount_l;

/** Pricing -> editable values (whole numbers; fractions become percentages). */
export function valuesFrom(p: Pricing = PRICING): PricingValues {
  const pct = (h: number) => Math.round((p.volumeTiers.find(([t]) => t === h)?.[1] ?? 0) * 100);
  return {
    rate_low: p.rates.low,
    rate_medium: p.rates.medium,
    rate_high: p.rates.high,
    on_site: p.onSiteSurcharge,
    travel: p.travel,
    urgency: p.extra,
    private_project: p.privateUse.project,
    private_hourly: p.privateUse.hourly,
    deposit_pct: Math.round(p.deposit * 100),
    discount_s: pct(p.sizes.s),
    discount_m: pct(p.sizes.m),
    discount_l: pct(p.sizes.l),
  };
}

/** Editable values -> a full Pricing (everything not editable comes from `base`). */
export function applyValues(v: PricingValues, base: Pricing = PRICING): Pricing {
  return {
    ...base,
    rates: { low: v.rate_low, medium: v.rate_medium, high: v.rate_high },
    onSiteSurcharge: v.on_site,
    travel: v.travel,
    extra: v.urgency,
    privateUse: { project: v.private_project, hourly: v.private_hourly },
    deposit: v.deposit_pct / 100,
    // Same order as the code default (highest first); 0% tiers are kept (estimate skips them).
    volumeTiers: [
      [base.sizes.l, v.discount_l / 100],
      [base.sizes.m, v.discount_m / 100],
      [base.sizes.s, v.discount_s / 100],
    ],
  };
}

/**
 * D1 rows -> Pricing. Never throws. Unknown keys are ignored; a missing,
 * non-integer or out-of-range value uses the code default for that field; if
 * the three size discounts end up incoherent they all go back to the defaults.
 */
export function mergeStoredPricing(rows: readonly { key: unknown; value: unknown }[] | null | undefined, base: Pricing = PRICING): Pricing {
  const def = valuesFrom(base);
  const out: PricingValues = { ...def };
  for (const r of rows ?? []) {
    if (typeof r?.key !== "string" || !isKey(r.key)) continue;
    if (isValidAmount(r.key, r.value)) out[r.key] = r.value;
  }
  if (!discountsCoherent(out)) {
    out.discount_s = def.discount_s;
    out.discount_m = def.discount_m;
    out.discount_l = def.discount_l;
  }
  return applyValues(out, base);
}

export type PricingValidation = { ok: true; values: PricingValues } | { ok: false; error: string; field?: string };

/**
 * Save API body: { values: { rate_low: 10, ... } } with every editable key,
 * nothing else. Whole numbers only (no strings, no decimals), each within its
 * bounds, deposit 0-100 %, size discounts 0-90 % and non-decreasing.
 */
export function validatePricingPayload(body: unknown): PricingValidation {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const raw = (body as { values?: unknown }).values;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "invalid_body" };
  const obj = raw as Record<string, unknown>;
  for (const k of Object.keys(obj)) if (!isKey(k)) return { ok: false, error: "unknown_field", field: k };
  const values = {} as PricingValues;
  for (const k of KEYS) {
    if (!(k in obj)) return { ok: false, error: "missing_field", field: k };
    if (!isValidAmount(k, obj[k])) return { ok: false, error: "invalid_value", field: k };
    values[k] = obj[k] as number;
  }
  if (!discountsCoherent(values)) return { ok: false, error: "discounts_order", field: "discount_m" };
  return { ok: true, values };
}

export const PRICING_KEYS = KEYS;
