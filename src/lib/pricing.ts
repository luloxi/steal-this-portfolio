/**
 * Pricing method (public, no client data). These are the code defaults:
 * the admin can override the amounts from /contratar in edit mode (D1
 * pricing_settings, see src/lib/pricing-settings.ts); any missing or invalid
 * stored value falls back to the number here.
 *  - Several days ("project"): (days × hours/day × hourly complexity) + on-site/day + travel/day + (urgency × day)
 *    On-site and urgency days are clamped to 1..project days (and their own caps).
 *  - One day ("hourly"): (hours × rate) + on-site + travel + urgency (hourly work counts as one day)
 *  - Both: + private use (flat, optional): the work is not shown in the portfolio and the code is not open source.
 */
export type Complexity = "low" | "medium" | "high";
export type Mode = "project" | "hourly";

export const PRICING = {
  currency: "USD",
  rates: { low: 10, medium: 18, high: 25 } as Record<Complexity, number>,
  onSiteSurcharge: 25,
  /** Always added with on-site work; may vary with distance. */
  travel: 25,
  /** Urgency surcharge: per required day in project mode, flat (one day) in hourly mode. */
  extra: 100,
  maxUrgencyDays: 10,
  /** Optional flat fee (both modes): by default the work can be shown and the code is open source; this keeps it private. */
  privateUse: { project: 500, hourly: 200 } as Record<Mode, number>,
  /** Volume-discount thresholds in total hours (days × hours/day): Chico 20, Mediano 30, Grande 40. */
  sizes: { s: 20, m: 30, l: 40 },
  /** Calculator starting values: a low, friendly first price. No on-site, no extras. */
  defaults: {
    /** Mode the calculator opens in (shown first, on the left). */
    mode: "hourly" as Mode,
    /** 2 × 4 h keeps the old 8 h low-rate starting price. */
    project: { days: 2, hoursPerDay: 4, complexity: "low" as Complexity },
    hourly: { hours: 2 },
  },
  /** "Varios días": day count 1..maxProjectDays, hours each day 1..maxHourlyHours (same cap as "Un día"). */
  maxProjectDays: 20,
  maxHourlyHours: 6,
  maxOnSiteDays: 10,
  /**
   * Project mode volume discount on total hours × rate (days × hours/day), highest tier wins.
   * Under 20 h none · 20–29 h 15% · 30–39 h 20% · 40 h and up 25%.
   */
  volumeTiers: [[40, 0.25], [30, 0.2], [20, 0.15]] as [number, number][],
  deposit: 0.5,
  validityDays: 15,
};

export type Pricing = typeof PRICING;

/** Whole number clamped to min..max. Empty, NaN and anything under min become min. */
export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n) || n < min) return min;
  return Math.min(max, Math.floor(n));
}

/** "Un día" hours and project hours/day: whole numbers, 1..maxHourlyHours. */
export function clampHours(n: number, max = PRICING.maxHourlyHours): number {
  return clampInt(n, 1, max);
}

/** Project length in days: whole numbers, 1..maxProjectDays. */
export function clampProjectDays(n: number, max = PRICING.maxProjectDays): number {
  return clampInt(n, 1, max);
}

/** Typed/pasted text -> digits only (no decimals, e, signs, spaces). "" when nothing usable. */
// Whole numbers: drop any decimal part ("2.5" → "2", not "25"), then keep digits only.
export const hoursDigits = (raw: string) => raw.split(/[.,]/)[0].replace(/\D+/g, "").replace(/^0+(?=\d)/, "").slice(0, 3);

export type Inputs = {
  mode: Mode;
  /**
   * Hourly: hours that day. Project: total hours when `days` and `hoursPerDay` are omitted
   * (no 8..40 clamp). When both are set, they win and this field is ignored.
   */
  hours?: number;
  complexity: Complexity;
  /** Urgency toggle (field kept as `extra`). */
  extra: boolean;
  /** Project mode: urgency days (each adds PRICING.extra), clamped to 1..project days. Hourly mode always uses 1. */
  extraDays?: number;
  onSite?: boolean;
  /** Project mode: on-site days (each adds surcharge + travel), clamped to 1..project days. */
  onSiteDays?: number;
  /** Private use: flat PRICING.privateUse[mode] (project 500, hourly 200), never discounted. Missing = false (old budgets). */
  privateUse?: boolean;
  /** Project mode: how many days (1..maxProjectDays). */
  days?: number;
  /** Project mode: hours each day (1..maxHourlyHours). */
  hoursPerDay?: number;
};

export type Line = { id: "work" | "discount" | "onSite" | "travel" | "extra" | "private"; amount: number; pct?: number; days?: number };

export function estimate(i: Inputs, p = PRICING): { lines: Line[]; total: number; deposit: number } {
  const project = i.mode === "project";
  // Both fields: days × hours/day (client `hours` ignored). Hours-only callers still price `hours` (no 8..40 clamp).
  const split = project && typeof i.days === "number" && typeof i.hoursPerDay === "number";
  const days = split ? clampProjectDays(i.days ?? 1, p.maxProjectDays) : 0;
  const hoursPerDay = split ? clampHours(i.hoursPerDay ?? 1, p.maxHourlyHours) : 0;
  const rawHours = i.hours ?? 0;
  const loose = Number.isFinite(rawHours) ? Math.max(0, Math.round(rawHours * 2) / 2) : 0;
  // Hourly keeps the previous half-hour rounding and 0..max cap.
  const hours = split ? days * hoursPerDay : project ? loose : Math.min(p.maxHourlyHours, loose);
  const work = hours * p.rates[i.complexity];
  const lines: Line[] = [{ id: "work", amount: work }];
  // Highest tier reached (0% tiers never add a line), whatever order they are stored in.
  const tier = project ? p.volumeTiers.filter(([, f]) => f > 0).sort((a, b) => b[0] - a[0]).find(([h]) => hours >= h) : undefined;
  if (tier) lines.push({ id: "discount", amount: -Math.round(work * tier[1]), pct: Math.round(tier[1] * 100) });
  if (i.onSite) {
    const wanted = Math.round(i.onSiteDays ?? 1);
    // Split: 1..project days, and still the on-site cap. Hours-only keeps the old cap only.
    const cap = split ? Math.min(days, p.maxOnSiteDays) : p.maxOnSiteDays;
    const n = project ? Math.max(1, Math.min(cap, Number.isFinite(wanted) ? wanted : 1)) : 1;
    lines.push({ id: "onSite", amount: p.onSiteSurcharge * n, days: n });
    lines.push({ id: "travel", amount: p.travel * n, days: n });
  }
  if (i.extra) {
    const wanted = Math.round(i.extraDays ?? 1) || 1;
    const cap = split ? Math.min(days, p.maxUrgencyDays) : p.maxUrgencyDays;
    const n = project ? Math.max(1, Math.min(cap, wanted)) : 1;
    lines.push({ id: "extra", amount: p.extra * n, days: n });
  }
  if (i.privateUse === true) lines.push({ id: "private", amount: p.privateUse[i.mode] });
  const total = lines.reduce((a, l) => a + l.amount, 0);
  return { lines, total, deposit: Math.round(total * p.deposit) };
}

/** "3 días × 4 h/día = 12 h · US$ 120". `totalUsd` is the estimated total. One day is singular. */
export function projectBreakdown(days: number, hoursPerDay: number, totalUsd: number, locale: "es" | "en"): string {
  const hours = days * hoursPerDay;
  const money = `${totalUsd < 0 ? "-" : ""}US$ ${Math.abs(Math.round(totalUsd)).toLocaleString("en-US")}`;
  if (locale === "en") return `${days} ${days === 1 ? "day" : "days"} × ${hoursPerDay} h/day = ${hours} h · ${money}`;
  return `${days} ${days === 1 ? "día" : "días"} × ${hoursPerDay} h/día = ${hours} h · ${money}`;
}

/** Deposit as a whole percentage (0.5 -> 50) for labels like "Anticipo (50%)". */
export const depositPct = (p: Pricing = PRICING) => Math.round(p.deposit * 100);

/** Size discounts ascending by hours, as whole percentages: [[20, 15], [30, 20], [40, 25]]. */
export function discountSteps(p: Pricing = PRICING): [number, number][] {
  return p.volumeTiers
    .map(([h, f]): [number, number] => [h, Math.round(f * 100)])
    .filter(([, pct]) => pct > 0)
    .sort((a, b) => a[0] - b[0]);
}
