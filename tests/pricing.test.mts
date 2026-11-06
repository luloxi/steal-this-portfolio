import { test } from "node:test";
import assert from "node:assert/strict";
import { estimate, PRICING } from "../src/lib/pricing.ts";

test("project examples from the method doc", () => {
  // 20h (Chico) → 15% off the hours cost only (not the extra)
  assert.equal(estimate({ mode: "project", hours: 20, complexity: "low", extra: true }).total, 170 + 100);
  assert.equal(estimate({ mode: "project", hours: 20, complexity: "high", extra: true }).total, 425 + 100);
  assert.equal(estimate({ mode: "project", hours: 10, complexity: "low", extra: false }).total, 100);
  assert.equal(estimate({ mode: "project", hours: 30, complexity: "low", extra: false }).total, 240); // Mediano 20%
});

test("project is days × hours/day: no 8h minimum, no 40h cap, client hours ignored when the split is set", () => {
  assert.equal(PRICING.maxProjectDays, 20);
  assert.equal(PRICING.maxHourlyHours, 6);
  assert.deepEqual(PRICING.sizes, { s: 20, m: 30, l: 40 });
  // 3 days × 4 h at the low rate, no discount (12 h).
  assert.equal(estimate({ mode: "project", days: 3, hoursPerDay: 4, complexity: "low", extra: false }).total, 120);
  // The hours field does not override the split.
  assert.equal(estimate({ mode: "project", hours: 40, days: 1, hoursPerDay: 1, complexity: "low", extra: false }).total, 10);
  // 20 × 6 = 120 h, 25% off → 900. Over-range inputs clamp in the calculator (the server rejects them).
  assert.equal(estimate({ mode: "project", days: 20, hoursPerDay: 6, complexity: "low", extra: false }).total, 900);
  assert.equal(estimate({ mode: "project", days: 99, hoursPerDay: 99, complexity: "low", extra: false }).total, 900);
  // Callers that only pass a total still price that many hours (the old 8..40 clamp is gone).
  assert.equal(estimate({ mode: "project", hours: 2, complexity: "low", extra: false }).total, 20);
  assert.equal(estimate({ mode: "project", hours: 80, complexity: "low", extra: false }).total, 600);
});

test("on-site and urgency days clamp to 1..project days, and still to their own caps", () => {
  const tight = estimate({ mode: "project", days: 3, hoursPerDay: 4, complexity: "low", extra: true, extraDays: 9, onSite: true, onSiteDays: 9 });
  assert.equal(tight.lines.find((l) => l.id === "onSite")?.days, 3);
  assert.equal(tight.lines.find((l) => l.id === "travel")?.days, 3);
  assert.equal(tight.lines.find((l) => l.id === "extra")?.days, 3);
  assert.equal(tight.total, 120 + 75 + 75 + 300); // 12 h × 10, no volume discount
  const wide = estimate({ mode: "project", days: 15, hoursPerDay: 1, complexity: "low", extra: true, extraDays: 99, onSite: true, onSiteDays: 99 });
  assert.equal(wide.lines.find((l) => l.id === "onSite")?.days, 10);
  assert.equal(wide.lines.find((l) => l.id === "extra")?.days, 10);
  // Private use stays a flat project amount, not per day.
  const priv = estimate({ mode: "project", days: 3, hoursPerDay: 4, complexity: "low", extra: false, privateUse: true });
  assert.equal(priv.total, 120 + 100);
  assert.deepEqual(priv.lines.at(-1), { id: "private", amount: 100 });
});

test("volume discount tiers (project only, highest tier)", () => {
  const pct = (h: number) => estimate({ mode: "project", hours: h, complexity: "low", extra: false }).lines.find((l) => l.id === "discount")?.pct ?? 0;
  assert.deepEqual([8, 19, 20, 29, 30, 39, 40].map(pct), [0, 0, 15, 15, 20, 20, 25]);
  assert.ok(!estimate({ mode: "hourly", hours: 12, complexity: "low", extra: false }).lines.some((l) => l.id === "discount"));
});

test("on-site always adds travel (US$25)", () => {
  const r = estimate({ mode: "hourly", hours: 4, complexity: "medium", extra: true, onSite: true });
  assert.equal(r.total, 72 + 25 + 25 + 100);
  assert.equal(r.deposit, 111);
  assert.equal(estimate({ mode: "hourly", hours: 4, complexity: "medium", extra: false, onSite: false }).total, 72);
  assert.equal(estimate({ mode: "project", hours: 8, complexity: "medium", extra: false, onSite: true }).total, 144 + 50); // 1 day default
});

test("hourly capped at 6h", () => {
  assert.equal(estimate({ mode: "hourly", hours: 12, complexity: "low", extra: false }).total, 60);
});

test("project on-site: days × (25 + 25), not discounted", () => {
  const r = estimate({ mode: "project", hours: 20, complexity: "low", extra: false, onSite: true, onSiteDays: 3 });
  assert.equal(r.total, 170 + 75 + 75);
  assert.equal(r.lines.find((l) => l.id === "travel")?.days, 3);
  assert.equal(estimate({ mode: "project", hours: 10, complexity: "low", extra: false, onSite: true, onSiteDays: 99 }).total, 100 + 500);
});

test("calculator defaults: low, friendly first price, nothing extra selected", () => {
  const { mode, project, hourly } = PRICING.defaults;
  assert.equal(mode, "hourly");
  assert.deepEqual(project, { days: 2, hoursPerDay: 4, complexity: "low" });
  assert.equal(hourly.hours, 2);
  const p = estimate({ mode: "project", days: project.days, hoursPerDay: project.hoursPerDay, complexity: project.complexity, extra: false, onSite: false, hours: 0 });
  assert.equal(p.total, 80); // 2 × 4 h × US$10, no discount, no on-site, no extras
  assert.deepEqual(p.lines.map((l) => l.id), ["work"]);
  assert.equal(estimate({ mode: "hourly", hours: hourly.hours, complexity: project.complexity, extra: false, onSite: false }).total, 20);
});

test("urgency: flat US$100 (one day) in hourly mode, per day in project mode, capped, off by default", () => {
  assert.equal(estimate({ mode: "hourly", hours: 2, complexity: "low", extra: true, extraDays: 3 }).total, 20 + 100);
  assert.equal(estimate({ mode: "hourly", hours: 2, complexity: "low", extra: true }).total, 20 + 100);
  assert.equal(estimate({ mode: "project", hours: 8, complexity: "low", extra: true, extraDays: 2, onSite: true, onSiteDays: 2 }).total, 80 + 100 + 200);
  assert.equal(estimate({ mode: "project", hours: 8, complexity: "low", extra: true, extraDays: 99 }).total, 80 + 1000);
  assert.equal(estimate({ mode: "project", hours: 8, complexity: "low", extra: false, extraDays: 5 }).total, 80);
  const l = estimate({ mode: "hourly", hours: 2, complexity: "low", extra: true, extraDays: 2 }).lines.find((x) => x.id === "extra");
  assert.deepEqual(l, { id: "extra", amount: 100, days: 1 });
});

test("project breakdown line uses the estimated total, with a singular day", async () => {
  const { projectBreakdown } = await import("../src/lib/pricing.ts");
  assert.equal(projectBreakdown(3, 4, 120, "es"), "3 días × 4 h/día = 12 h · US$ 120");
  assert.equal(projectBreakdown(1, 4, 40, "es"), "1 día × 4 h/día = 4 h · US$ 40");
  assert.equal(projectBreakdown(3, 4, 120, "en"), "3 days × 4 h/day = 12 h · US$ 120");
  assert.equal(projectBreakdown(1, 4, 40, "en"), "1 day × 4 h/day = 4 h · US$ 40");
  assert.equal(projectBreakdown(2, 4, 1100, "en"), "2 days × 4 h/day = 8 h · US$ 1,100");
});

test("hours input: digits only; hours 1..6; project days 1..20", async () => {
  const { clampHours, clampProjectDays, hoursDigits } = await import("../src/lib/pricing.ts");
  assert.equal(hoursDigits("2.5"), "2");
  assert.equal(hoursDigits("1e3"), "13");
  assert.equal(hoursDigits("3,9"), "3");
  assert.equal(hoursDigits("-4"), "4");
  assert.equal(hoursDigits("+ 7 h"), "7");
  assert.equal(hoursDigits("abc"), "");
  assert.equal(hoursDigits("007"), "7");
  assert.equal(clampHours(9), 6);
  assert.equal(clampHours(0), 1);
  assert.equal(clampHours(Number("")), 1);
  assert.equal(clampHours(3.7), 3);
  assert.equal(clampHours(1), 1);
  assert.equal(clampProjectDays(999), 20);
  assert.equal(clampProjectDays(0), 1);
  assert.equal(clampProjectDays(Number("")), 1);
  assert.equal(clampProjectDays(12.9), 12);
  assert.equal(clampProjectDays(1), 1);
  assert.equal(PRICING.maxHourlyHours, 6);
  assert.equal(PRICING.maxProjectDays, 20);
});

test("private use: flat +US$ 100 in both modes, own line, not discounted, counts toward the deposit", () => {
  const off = estimate({ mode: "project", hours: 20, complexity: "low", extra: false });
  const on = estimate({ mode: "project", hours: 20, complexity: "low", extra: false, privateUse: true });
  assert.deepEqual(PRICING.privateUse, { project: 100, hourly: 100 });
  assert.equal(on.total, off.total + 100); // 170 + 100: the 15% volume discount stays on hours × rate only
  assert.equal(on.deposit, Math.round((off.total + 100) / 2));
  assert.deepEqual(on.lines.at(-1), { id: "private", amount: 100 });
  assert.ok(!off.lines.some((l) => l.id === "private"));
  const h = estimate({ mode: "hourly", hours: 2, complexity: "low", extra: true, onSite: true, privateUse: true });
  assert.equal(h.total, 20 + 25 + 25 + 100 + 100);
  assert.equal(h.deposit, 135);
  // Old callers without the field: no line, same totals as before.
  assert.equal(estimate({ mode: "hourly", hours: 2, complexity: "low", extra: false }).total, 20);
});
