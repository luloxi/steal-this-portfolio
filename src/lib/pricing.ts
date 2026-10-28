/**
 * Pricing method (public, no client data). These are the code defaults:
 * the admin can override the amounts from /contratar in edit mode (D1
 * pricing_settings, see src/lib/pricing-settings.ts); any missing or invalid
 * stored value falls back to the number here.
 *  - Per project: (hours × hourly complexity) + on-site/day + travel/day + (urgency × day)
 *  - Per hour: (hours × rate) + on-site + travel + urgency (hourly work counts as one day)
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
  /** Project size presets in hours (research, build, testing, polish, feedback, fixes, delivery). */
  sizes: { s: 20, m: 30, l: 40 },
  /** Calculator starting values: a low, friendly first price. No on-site, no extras. */
  defaults: {
    /** Mode the calculator opens in (shown first, on the left). */
    mode: "hourly" as Mode,
    project: { hours: 8, complexity: "low" as Complexity },
    hourly: { hours: 2 },
  },
  /** Per project starts at 8 h (less than that is hourly work); over 40 h is negotiated. */
  minProjectHours: 8,
  maxProjectHours: 40,
  maxHourlyHours: 6,
  maxOnSiteDays: 10,
  /**
   * Project mode volume discount on hours × rate, by size: [minHoursInclusive, pct], highest tier wins.
   * 8–19 h none · 20–29 h Chico 15% · 30–39 h Mediano 20% · 40 h Grande 25%.
   */
  volumeTiers: [[40, 0.25], [30, 0.2], [20, 0.15]] as [number, number][],
  deposit: 0.5,
  validityDays: 15,
};

export type Pricing = typeof PRICING;

export const maxHoursFor = (mode: Mode) => (mode === "project" ? PRICING.maxProjectHours : PRICING.maxHourlyHours);
export const minHoursFor = (mode: Mode) => (mode === "project" ? PRICING.minProjectHours : 1);

/** Hours are whole numbers min..max for the mode (1–6 per hour, 8–40 per project; client input and server use the same rule). */
export function clampHours(mode: Mode, n: number): number {
  const min = minHoursFor(mode);
  if (!Number.isFinite(n) || n < min) return min;
  return Math.min(maxHoursFor(mode), Math.floor(n));
}

/** Typed/pasted text -> digits only (no decimals, e, signs, spaces). "" when nothing usable. */
// Whole hours: drop any decimal part ("2.5" → "2", not "25"), then keep digits only.
export const hoursDigits = (raw: string) => raw.split(/[.,]/)[0].replace(/\D+/g, "").replace(/^0+(?=\d)/, "").slice(0, 3);

export type Inputs = {
  mode: Mode;
  hours: number;
  complexity: Complexity;
  /** Urgency toggle (field kept as `extra`). */
  extra: boolean;
  /** Project mode: urgency days (each adds PRICING.extra). Hourly mode always uses 1. */
  extraDays?: number;
  onSite?: boolean;
  /** Project mode: on-site days (each adds surcharge + travel). */
  onSiteDays?: number;
  /** Private use: flat PRICING.privateUse[mode] (project 500, hourly 200), never discounted. Missing = false (old budgets). */
  privateUse?: boolean;
};

export type Line = { id: "work" | "discount" | "onSite" | "travel" | "extra" | "private"; amount: number; pct?: number; days?: number };

export function estimate(i: Inputs, p = PRICING): { lines: Line[]; total: number; deposit: number } {
  const hours = Math.min(i.mode === "project" ? p.maxProjectHours : p.maxHourlyHours, Math.max(i.mode === "project" ? p.minProjectHours : 0, Math.round(i.hours * 2) / 2));
  const work = hours * p.rates[i.complexity];
  const lines: Line[] = [{ id: "work", amount: work }];
  // Highest tier reached (0% tiers never add a line), whatever order they are stored in.
  const tier = i.mode === "project" ? p.volumeTiers.filter(([, f]) => f > 0).sort((a, b) => b[0] - a[0]).find(([h]) => hours >= h) : undefined;
  if (tier) lines.push({ id: "discount", amount: -Math.round(work * tier[1]), pct: Math.round(tier[1] * 100) });
  if (i.onSite) {
    const days = i.mode === "project" ? Math.max(1, Math.min(p.maxOnSiteDays, Math.round(i.onSiteDays ?? 1))) : 1;
    lines.push({ id: "onSite", amount: p.onSiteSurcharge * days, days });
    lines.push({ id: "travel", amount: p.travel * days, days });
  }
  if (i.extra) {
    const days = i.mode === "project" ? Math.max(1, Math.min(p.maxUrgencyDays, Math.round(i.extraDays ?? 1) || 1)) : 1;
    lines.push({ id: "extra", amount: p.extra * days, days });
  }
  if (i.privateUse === true) lines.push({ id: "private", amount: p.privateUse[i.mode] });
  const total = lines.reduce((a, l) => a + l.amount, 0);
  return { lines, total, deposit: Math.round(total * p.deposit) };
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
