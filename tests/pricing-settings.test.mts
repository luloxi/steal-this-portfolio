import { test } from "node:test";
import assert from "node:assert/strict";
import { estimate, PRICING } from "../src/lib/pricing.ts";
import { applyValues, mergeStoredPricing, PRICING_KEYS, validatePricingPayload, valuesFrom } from "../src/lib/pricing-settings.ts";
import { handlePricingSave, pricingGate } from "../src/lib/pricing-api.ts";
import { handleHireContact } from "../src/lib/hire-contact.ts";
import { loadPricing, savePricing } from "../src/lib/pricing-db.ts";
import { d1 } from "./d1-sqlite.mts";

const DEFAULTS = valuesFrom(PRICING);
const ALL_MIGRATIONS = ["0001_init.sql", "0002_better_auth.sql", "0009_referrals.sql", "0010_pricing_settings.sql"];

test("defaults: the editable values are today's numbers and round-trip to PRICING exactly", () => {
  assert.deepEqual(DEFAULTS, {
    rate_low: 10, rate_medium: 18, rate_high: 25, on_site: 25, travel: 25, urgency: 100,
    private_project: 500, private_hourly: 200, deposit_pct: 50, discount_s: 15, discount_m: 20, discount_l: 25,
  });
  assert.deepEqual(applyValues(DEFAULTS), PRICING);
  assert.deepEqual(mergeStoredPricing([]), PRICING);
  assert.deepEqual(mergeStoredPricing(null), PRICING);
});

test("validation: full payload of whole numbers in bounds, coherent discounts", () => {
  assert.deepEqual(validatePricingPayload({ values: DEFAULTS }), { ok: true, values: DEFAULTS });
  const bad = (patch: Record<string, unknown>) => validatePricingPayload({ values: { ...DEFAULTS, ...patch } });
  assert.deepEqual(bad({ rate_low: -1 }), { ok: false, error: "invalid_value", field: "rate_low" });
  assert.deepEqual(bad({ rate_low: 10.5 }), { ok: false, error: "invalid_value", field: "rate_low" });
  assert.deepEqual(bad({ rate_low: "12" }), { ok: false, error: "invalid_value", field: "rate_low" });
  assert.deepEqual(bad({ rate_low: NaN }), { ok: false, error: "invalid_value", field: "rate_low" });
  assert.deepEqual(bad({ rate_high: 1001 }), { ok: false, error: "invalid_value", field: "rate_high" });
  assert.deepEqual(bad({ deposit_pct: 101 }), { ok: false, error: "invalid_value", field: "deposit_pct" });
  assert.equal(bad({ deposit_pct: 0 }).ok, true);
  assert.equal(bad({ deposit_pct: 100 }).ok, true);
  assert.deepEqual(bad({ discount_l: 91 }), { ok: false, error: "invalid_value", field: "discount_l" });
  assert.deepEqual(bad({ discount_s: 30 }), { ok: false, error: "discounts_order", field: "discount_m" });
  assert.equal(bad({ discount_s: 0, discount_m: 0, discount_l: 0 }).ok, true);
  assert.deepEqual(bad({ total: 1 }), { ok: false, error: "unknown_field", field: "total" });
  const { travel: _t, ...missing } = DEFAULTS; // eslint-disable-line @typescript-eslint/no-unused-vars
  assert.deepEqual(validatePricingPayload({ values: missing }), { ok: false, error: "missing_field", field: "travel" });
  for (const b of [null, "x", {}, { values: [] }, { values: null }]) assert.equal(validatePricingPayload(b).ok, false);
});

test("fallback per field: missing, invalid or unknown stored rows keep the code default", () => {
  const p = mergeStoredPricing([
    { key: "rate_medium", value: 30 },
    { key: "travel", value: -5 }, // invalid -> default
    { key: "urgency", value: 12.5 }, // invalid -> default
    { key: "on_site", value: "40" }, // text -> default
    { key: "nope", value: 1 }, // unknown -> ignored
    { key: "deposit_pct", value: 30 },
  ]);
  assert.deepEqual(p.rates, { low: 10, medium: 30, high: 25 });
  assert.equal(p.travel, 25);
  assert.equal(p.extra, 100);
  assert.equal(p.onSiteSurcharge, 25);
  assert.equal(p.deposit, 0.3);
  // Incoherent stored discounts -> all three back to defaults.
  const q = mergeStoredPricing([{ key: "discount_s", value: 40 }, { key: "discount_m", value: 10 }]);
  assert.deepEqual(q.volumeTiers, PRICING.volumeTiers);
  // Non-editable limits always come from code.
  assert.equal(p.maxProjectDays, PRICING.maxProjectDays);
  assert.equal(p.maxHourlyHours, PRICING.maxHourlyHours);
  assert.deepEqual(p.sizes, PRICING.sizes);
});

test("edited amounts drive the estimate: rates, conditions, private use, deposit and 0% tiers", () => {
  const p = applyValues({ ...DEFAULTS, rate_low: 12, on_site: 30, travel: 10, urgency: 50, private_hourly: 300, deposit_pct: 30, discount_s: 0, discount_m: 10, discount_l: 10 });
  const h = estimate({ mode: "hourly", hours: 2, complexity: "low", extra: true, onSite: true, privateUse: true }, p);
  assert.equal(h.total, 24 + 30 + 10 + 50 + 300);
  assert.equal(h.deposit, Math.round(h.total * 0.3));
  const at20 = estimate({ mode: "project", hours: 20, complexity: "low", extra: false }, p);
  assert.deepEqual(at20.lines.map((l) => l.id), ["work"]); // 0% Chico: no discount line
  assert.equal(at20.total, 240);
  const at40 = estimate({ mode: "project", hours: 40, complexity: "low", extra: false }, p);
  assert.equal(at40.lines.find((l) => l.id === "discount")?.pct, 10);
});

test("permissions: anon 401, signed-in non-admin 403, admin with edit mode off 403, admin + edit mode passes", async () => {
  let saves = 0;
  const save = async () => void saves++;
  const body = { values: DEFAULTS };
  assert.deepEqual(await handlePricingSave({ signedIn: false, isAdmin: false, editOn: true }, body, save), { status: 401, body: { error: "unauthorized" } });
  assert.deepEqual(await handlePricingSave({ signedIn: true, isAdmin: false, editOn: true }, body, save), { status: 403, body: { error: "forbidden" } });
  assert.deepEqual(await handlePricingSave({ signedIn: true, isAdmin: false, editOn: false }, body, save), { status: 403, body: { error: "forbidden" } });
  assert.deepEqual(await handlePricingSave({ signedIn: true, isAdmin: true, editOn: false }, body, save), { status: 403, body: { error: "edit_mode_off" } });
  assert.equal(saves, 0);
  // Gate runs before validation: a bad body from a non-admin is still 403, not 400.
  assert.equal((await handlePricingSave({ signedIn: true, isAdmin: false, editOn: true }, { values: { rate_low: -1 } }, save)).status, 403);
  const bad = await handlePricingSave({ signedIn: true, isAdmin: true, editOn: true }, { values: { ...DEFAULTS, rate_low: -1 } }, save);
  assert.deepEqual([bad.status, bad.body.error, bad.body.field, saves], [400, "invalid_value", "rate_low", 0]);
  const ok = await handlePricingSave({ signedIn: true, isAdmin: true, editOn: true }, body, save);
  assert.equal(ok.status, 200);
  assert.equal(saves, 1);
  assert.equal(pricingGate({ signedIn: true, isAdmin: true, editOn: true }), null);
  const boom = await handlePricingSave({ signedIn: true, isAdmin: true, editOn: true }, body, async () => { throw new Error("x"); });
  assert.deepEqual(boom, { status: 500, body: { error: "save_failed" } });
});

test("D1: no table or no rows -> defaults; save upserts every key (no deletes) and reads back", async () => {
  assert.deepEqual(await loadPricing(null), PRICING);
  assert.deepEqual(await loadPricing(d1(["0001_init.sql"])), PRICING); // table missing
  const db = d1(ALL_MIGRATIONS);
  assert.deepEqual(await loadPricing(db), PRICING); // table, no rows
  await savePricing(db, { ...DEFAULTS, rate_high: 40 });
  await savePricing(db, { ...DEFAULTS, rate_high: 45, deposit_pct: 40 });
  const rows = db.raw.prepare("SELECT key, value FROM pricing_settings ORDER BY key").all() as { key: string; value: number }[];
  assert.equal(rows.length, PRICING_KEYS.length);
  const p = await loadPricing(db);
  assert.equal(p.rates.high, 45);
  assert.equal(p.deposit, 0.4);
  // The table itself refuses non-integers and negatives.
  assert.throws(() => db.raw.prepare("INSERT INTO pricing_settings (key, value) VALUES ('x', -1)").run());
  assert.throws(() => db.raw.prepare("INSERT INTO pricing_settings (key, value) VALUES ('y', 1.5)").run());
  // A row corrupted by hand falls back for that field only.
  db.raw.prepare("UPDATE pricing_settings SET value = 5000 WHERE key = 'rate_low'").run();
  const q = await loadPricing(db);
  assert.equal(q.rates.low, 10);
  assert.equal(q.rates.high, 45);
});

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
function mkEnv() {
  const sent: { text: string; html: string; subject: string }[] = [];
  const env = {
    TURNSTILE_SECRET_KEY: "ts-secret",
    fetch: (async (u: string) => (u === SITEVERIFY ? Response.json({ success: true }) : new Response("{}"))) as unknown as typeof fetch,
    CONTACT_EMAIL: { send: async (m: unknown) => void sent.push(m as never) },
  };
  return { env, sent };
}

test("hire-contact: email and hire_leads use the stored amounts, never the browser's total or rates", async () => {
  const db = d1(ALL_MIGRATIONS);
  await savePricing(db, { ...DEFAULTS, rate_medium: 30, on_site: 40, travel: 20, private_project: 700, deposit_pct: 40 });
  const pricing = await loadPricing(db);
  const { env, sent } = mkEnv();
  const leads: { totalUsd: number; budgetJson: string }[] = [];
  const r = await handleHireContact(
    {
      name: "Ana",
      email: "ana@example.com",
      message: "Hola",
      turnstileToken: "t",
      budget: { mode: "project", days: 5, hoursPerDay: 4, hours: 1, complexity: "medium", onSite: true, onSiteDays: 2, extra: false, privateUse: true, total: 1, deposit: 1, rates: { medium: 1 } },
    },
    env,
    "1.1.1.1",
    { pricing, saveLead: async (l) => void leads.push(l) },
  );
  assert.equal(r.status, 200);
  // 20h × 30 = 600, -15% = -90, on-site 2×40 + travel 2×20 = 120, private 700 → 1330; deposit 40% = 532
  assert.equal(leads[0].totalUsd, 1330);
  assert.deepEqual([JSON.parse(leads[0].budgetJson).total, JSON.parse(leads[0].budgetJson).deposit], [1330, 532]);
  assert.match(sent[0].text, /Total estimado: US\$ 1,330/);
  assert.match(sent[0].text, /Anticipo \(40%\): US\$ 532/);
  assert.match(sent[0].text, /Complejidad: Media \(US\$ 30\/h\)/);
  assert.match(sent[0].html, /Anticipo \(40%\)/);
  // Without stored pricing the same request uses the code defaults (today's numbers).
  const d = mkEnv();
  const leads2: { totalUsd: number }[] = [];
  await handleHireContact(
    { name: "Ana", email: "ana@example.com", message: "Hola", turnstileToken: "t", budget: { mode: "project", days: 5, hoursPerDay: 4, hours: 1, complexity: "medium", onSite: true, onSiteDays: 2, extra: false, privateUse: true } },
    d.env,
    "x",
    { saveLead: async (l) => void leads2.push(l) },
  );
  assert.equal(leads2[0].totalUsd, 406 + 500);
  assert.match(d.sent[0].text, /Anticipo \(50%\)/);
});
