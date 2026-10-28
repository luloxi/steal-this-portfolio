/** Referral program: codes, cookie, money, D1 (0009) and permissions. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  checkCodeShape,
  formatCents,
  normalizeWhatsapp,
  parseAmountCents,
  payoutCents,
  payoutTotals,
  refCookie,
  refFromCookie,
  safeNext,
  shareLinks,
  waLink,
} from "../src/lib/referrals.ts";
import { getActiveReferrer, insertLead, getMyReferral } from "../src/lib/referrals-db.ts";
import { adminGate, adminList, adminSetActive, adminUpdatePayout, checkCode, myReferral, signup, type Viewer } from "../src/lib/referrals-api.ts";
import { handleHireContact } from "../src/lib/hire-contact.ts";
import { d1 } from "./d1-sqlite.mts";

const ANA: Viewer = { id: "u-ana", email: "ana@example.com", name: "Ana Pérez", isAdmin: false };
const BETO: Viewer = { id: "u-beto", email: "beto@example.com", name: "Beto", isAdmin: false };
const ADMIN: Viewer = { id: "u-lulo", email: "lucianoolivabianco@gmail.com", name: "Luciano", isAdmin: true };
const fresh = () => d1(["0009_referrals.sql"]);

test("code shape: a-z 0-9 inner hyphens, 3-24, case-insensitive, reserved words blocked", () => {
  assert.deepEqual(checkCodeShape("  Ana-Dev "), { ok: true, code: "ana-dev" });
  assert.deepEqual(checkCodeShape("abc"), { ok: true, code: "abc" });
  assert.deepEqual(checkCodeShape("a".repeat(24)), { ok: true, code: "a".repeat(24) });
  for (const bad of ["ab", "a".repeat(25), "-ana", "ana-", "ana--dev", "ana_dev", "añá", "ana dev", "", null, 42]) {
    assert.deepEqual(checkCodeShape(bad), { ok: false, error: "invalid" }, String(bad));
  }
  for (const r of ["admin", "ADMIN", "api", "lulox", "en", "es", "referidos", "a-d-m-i-n", "sign-in"]) {
    const res = checkCodeShape(r);
    // "en"/"es" are too short anyway: invalid before reserved.
    assert.equal(res.ok, false, r);
  }
  assert.deepEqual(checkCodeShape("a-d-m-i-n"), { ok: false, error: "reserved" });
  assert.deepEqual(checkCodeShape("Lulox"), { ok: false, error: "reserved" });
});

test("lulox-ref cookie: 90 days, parse back, garbage ignored", () => {
  const c = refCookie("ana-dev", true);
  assert.match(c, /^lulox-ref=ana-dev; Path=\/; Max-Age=7776000; SameSite=Lax; Secure$/);
  assert.equal(refFromCookie("a=1; lulox-ref=Ana-Dev; b=2"), "ana-dev");
  assert.equal(refFromCookie("lulox-ref=%3Cscript%3E"), null);
  assert.equal(refFromCookie(""), null);
  assert.deepEqual(shareLinks("ana-dev", "https://example.com"), { es: "https://example.com/contratar?ref=ana-dev", en: "https://example.com/en/hire?ref=ana-dev" });
});

test("money: 15% in cents, amounts in AR/US formats, totals per currency", () => {
  assert.equal(payoutCents(100000), 15000);
  assert.equal(payoutCents(333), 50); // 49.95 -> 50
  assert.equal(parseAmountCents("150000"), 15000000);
  assert.equal(parseAmountCents("150.000"), 15000000); // AR thousands
  assert.equal(parseAmountCents("150.000,50"), 15000050);
  assert.equal(parseAmountCents("1,234.56"), 123456);
  assert.equal(parseAmountCents("1500.5"), 150050);
  assert.equal(parseAmountCents(1200), 120000);
  for (const bad of ["", "-5", "abc", "1e5", null]) assert.equal(parseAmountCents(bad), null, String(bad));
  assert.equal(formatCents(15000000, "ARS"), "AR$ 150.000");
  assert.equal(formatCents(4550, "USD"), "US$ 45,50");
  assert.deepEqual(
    payoutTotals([{ currency: "USD", payout_cents: 100, status: "pending" }, { currency: "USD", payout_cents: 50, status: "paid" }, { currency: "ARS", payout_cents: 7, status: "pending" }, null]),
    { USD: { pending: 100, paid: 50 }, ARS: { pending: 7, paid: 0 } },
  );
});

test("whatsapp, wa.me and sign-in ?next (no open redirect)", () => {
  assert.equal(normalizeWhatsapp("+54 9 11 1234-5678"), "+5491112345678");
  assert.equal(normalizeWhatsapp(""), "");
  assert.equal(normalizeWhatsapp(undefined), "");
  assert.equal(normalizeWhatsapp("1234"), null);
  assert.equal(normalizeWhatsapp("call me"), null);
  assert.equal(waLink("+5491112345678", "Hola"), "https://wa.me/5491112345678?text=Hola");
  assert.equal(waLink(null), null);
  assert.equal(safeNext("/referidos"), "/referidos");
  assert.equal(safeNext("/en/referrals"), "/en/referrals");
  for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", undefined]) assert.equal(safeNext(bad), "/blog", String(bad));
});

test("migration 0009 is additive, idempotent and enforces its constraints", () => {
  const sql = readFileSync(new URL("../migrations/0009_referrals.sql", import.meta.url), "utf8");
  assert.ok(!/\b(DROP|DELETE|RENAME|ALTER)\b/i.test(sql.replace(/--.*$/gm, "")), "only CREATE ... IF NOT EXISTS");
  const db = fresh();
  db.raw.exec(sql); // twice: no error
  const ins = db.raw.prepare("INSERT INTO referrers (id, code, name, email, user_id) VALUES (?, ?, 'x', 'x@x.co', ?)");
  ins.run("r1", "ana", "u1");
  assert.throws(() => ins.run("r2", "ana", "u2"), /UNIQUE/); // same code
  assert.throws(() => ins.run("r3", "ANA", null), /CHECK|UNIQUE/); // uppercase never stored
  assert.throws(() => ins.run("r4", "otro", "u1"), /UNIQUE/); // one code per account
  ins.run("r5", "sin-cuenta", null);
  ins.run("r6", "sin-cuenta-2", null); // NULL user_id is not unique-checked
  assert.throws(() => db.raw.prepare("INSERT INTO referral_payouts (lead_id, currency, amount_cents, payout_cents) VALUES ('nope', 'EUR', 1, 1)").run());
});

test("signup: needs a session, validates, one code per account, duplicates and reserved refused", async () => {
  const db = fresh();
  const ok = { name: "  Ana  Pérez ", whatsapp: "+54 9 11 1234 5678", code: "Ana-Dev" };
  assert.equal((await signup(null, ok, { db })).status, 401);
  assert.deepEqual((await signup(ANA, { ...ok, code: "admin" }, { db })).body, { error: "code_reserved" });
  assert.deepEqual((await signup(ANA, { ...ok, code: "a" }, { db })).body, { error: "code_invalid" });
  assert.deepEqual((await signup(ANA, { ...ok, whatsapp: "123" }, { db })).body, { error: "invalid_whatsapp" });
  assert.deepEqual((await signup(ANA, { ...ok, name: " " }, { db })).body, { error: "invalid_name" });
  assert.equal((await signup(ANA, ok, { db, limit: async () => false })).status, 429);
  const r = await signup(ANA, { ...ok, email: "spoof@evil.com" }, { db });
  assert.equal(r.status, 200);
  assert.equal(r.body.code, "ana-dev");
  const row = db.raw.prepare("SELECT code, name, email, whatsapp, user_id, active FROM referrers").get();
  // Email always from the Google session, never from the body.
  assert.deepEqual({ ...row }, { code: "ana-dev", name: "Ana Pérez", email: "ana@example.com", whatsapp: "+5491112345678", user_id: "u-ana", active: 1 });
  assert.deepEqual((await signup(ANA, { ...ok, code: "otro" }, { db })).body, { error: "already_has_code", code: "ana-dev" });
  assert.deepEqual((await signup(BETO, { ...ok, code: "ANA-DEV" }, { db })).body, { error: "code_taken" });
  assert.deepEqual((await checkCode("Ana-Dev", db)).body, { status: "taken", code: "ana-dev", active: true });
  assert.deepEqual((await checkCode("libre", db)).body, { status: "available", code: "libre" });
  assert.deepEqual((await checkCode("api", db)).body, { status: "reserved" });
  assert.deepEqual((await checkCode("x", db)).body, { status: "invalid" });
});

test("hidden referrals section: users get 404 on signup, the admin can still create his own code", async () => {
  const db = fresh();
  assert.equal((await signup(BETO, { name: "B", code: "beto" }, { db, sectionHidden: true })).status, 404);
  const a = await signup(ADMIN, { name: "Luciano", code: "lulo-ref" }, { db, sectionHidden: true });
  assert.equal(a.status, 200);
  const mine = await myReferral(ADMIN, db);
  assert.equal((mine.body.referral as { referrer: { code: string } }).referrer.code, "lulo-ref");
});

test("permissions: users only ever see their own data; admin endpoints are 401/403 for everyone else", async () => {
  const db = fresh();
  await signup(ANA, { name: "Ana", code: "ana" }, { db });
  await signup(BETO, { name: "Beto", code: "beto" }, { db });
  const anaRef = (await getActiveReferrer(db, "ana"))!;
  const lead = await insertLead(db, { name: "Cliente", email: "c@x.co", message: "hola", budgetJson: "{}", totalUsd: 500, refCode: "ana", referrerId: anaRef.id });

  assert.equal((await myReferral(null, db)).status, 401);
  const beto = (await myReferral(BETO, db)).body.referral as { referrer: { code: string; email: string }; leads: number };
  assert.equal(beto.referrer.code, "beto");
  assert.equal(beto.leads, 0, "Beto doesn't see Ana's lead");
  assert.ok(!JSON.stringify(beto).includes("ana"), "nothing of Ana in Beto's panel");
  const ana = (await myReferral(ANA, db)).body.referral as { leads: number };
  assert.equal(ana.leads, 1);
  assert.ok(!JSON.stringify(ana).includes("Cliente"), "own panel: aggregates only, no client names");

  for (const v of [null, ANA, BETO]) {
    const want = v ? 403 : 401;
    assert.equal(adminGate(v)?.status, want);
    assert.equal((await adminList(v, db)).status, want);
    assert.equal((await adminUpdatePayout(v, lead, { currency: "USD", amount: "1000", status: "paid" }, db)).status, want);
    assert.equal((await adminSetActive(v, anaRef.id, { active: false }, db)).status, want);
  }
  assert.equal(db.raw.prepare("SELECT count(*) AS n FROM referral_payouts").get()!.n, 0, "nothing written by non-admins");
  assert.equal((await getActiveReferrer(db, "ana"))?.active, 1);
});

test("admin: 15% payout, pending/paid with date, totals per referrer and currency, deactivate without deleting", async () => {
  const db = fresh();
  await signup(ANA, { name: "Ana", code: "ana" }, { db });
  const ana = (await getActiveReferrer(db, "ana"))!;
  const l1 = await insertLead(db, { name: "C1", email: "c1@x.co", message: "m", budgetJson: "{}", totalUsd: 900, refCode: "ana", referrerId: ana.id });
  const l2 = await insertLead(db, { name: "C2", email: "c2@x.co", message: "m", budgetJson: "{}", totalUsd: 300, refCode: "ana", referrerId: ana.id });
  const noRef = await insertLead(db, { name: "C3", email: "c3@x.co", message: "m", budgetJson: "{}", totalUsd: 100, refCode: null, referrerId: null });

  const u1 = await adminUpdatePayout(ADMIN, l1, { currency: "USD", amount: "1000", status: "pending" }, db);
  assert.equal(u1.status, 200);
  assert.equal((u1.body.payout as { payout_cents: number }).payout_cents, 15000);
  await adminUpdatePayout(ADMIN, l2, { currency: "ARS", amount: "200.000", status: "paid" }, db);
  assert.deepEqual((await adminUpdatePayout(ADMIN, l1, { currency: "EUR", amount: "1" }, db)).body, { error: "invalid_currency" });
  assert.deepEqual((await adminUpdatePayout(ADMIN, l1, { currency: "USD", amount: "-1" }, db)).body, { error: "invalid_amount" });
  assert.equal((await adminUpdatePayout(ADMIN, noRef, { currency: "USD", amount: "10" }, db)).status, 404, "only referred leads get a payout");

  const list = (await adminList(ADMIN, db)).body.referrers as { code: string; leads: { id: string; payout: { status: string; paid_at: string | null } | null }[]; totals: unknown }[];
  assert.equal(list.length, 1);
  assert.equal(list[0].leads.length, 2);
  assert.deepEqual(list[0].totals, { USD: { pending: 15000, paid: 0 }, ARS: { pending: 0, paid: 3000000 } });
  const paid = list[0].leads.find((l) => l.id === l2)!.payout!;
  assert.equal(paid.status, "paid");
  assert.match(paid.paid_at ?? "", /^\d{4}-\d{2}-\d{2}T/);
  // Back to pending clears the date; marking paid again stamps a new one.
  await adminUpdatePayout(ADMIN, l2, { currency: "ARS", amount: "200000", status: "pending" }, db);
  assert.equal((db.raw.prepare("SELECT paid_at FROM referral_payouts WHERE lead_id = ?").get(l2) as { paid_at: string | null }).paid_at, null);

  // The referrer sees the same totals in their own panel.
  const mine = await getMyReferral(db, "u-ana");
  assert.deepEqual(mine?.totals, { USD: { pending: 15000, paid: 0 }, ARS: { pending: 3000000, paid: 0 } });

  // Deactivate: row and leads stay, the code stops attributing.
  assert.equal((await adminSetActive(ADMIN, ana.id, { active: false }, db)).status, 200);
  assert.equal(await getActiveReferrer(db, "ana"), null);
  assert.equal((await checkCode("ana", db)).body.active, false);
  assert.equal(db.raw.prepare("SELECT count(*) AS n FROM referrers").get()!.n, 1);
  assert.equal(db.raw.prepare("SELECT count(*) AS n FROM hire_leads").get()!.n, 3);
  assert.equal((await adminSetActive(ADMIN, "nope", { active: true }, db)).status, 404);
  assert.equal((await adminSetActive(ADMIN, ana.id, { active: "yes" }, db)).status, 400);
});

test("hire form: valid active code is attributed, stored with the server budget and added to the mail", async () => {
  const db = fresh();
  await signup(ANA, { name: "Ana Pérez", code: "ana" }, { db });
  await signup(BETO, { name: "Beto", code: "beto" }, { db });
  const beto = (await getActiveReferrer(db, "beto"))!;
  await adminSetActive(ADMIN, beto.id, { active: false }, db);
  const sent: { text: string; html: string }[] = [];
  const env = {
    TURNSTILE_SECRET_KEY: "s",
    RESEND_API_KEY: "test-key", // mocked below: no real email is sent
    fetch: (async (u: string, init: RequestInit) => {
      if (String(u).includes("siteverify")) return Response.json({ success: true });
      sent.push(JSON.parse(String(init.body)));
      return new Response("{}");
    }) as unknown as typeof fetch,
  };
  const deps = {
    findReferrer: (c: string) => getActiveReferrer(db, c),
    saveLead: (l: Parameters<typeof insertLead>[1]) => insertLead(db, l),
  };
  const base = { name: "Cliente", email: "cli@example.com", message: "Hola", turnstileToken: "t", budget: { mode: "project", hours: 20, complexity: "medium", onSite: false, days: 0, extra: false, total: 1 } };
  const r = await handleHireContact({ ...base, refCode: " ANA " }, env, "1.1.1.1", deps);
  assert.deepEqual(r, { status: 200, body: { ok: true, ref: "ana" } });
  assert.match(sent[0].text, /Referido por: ana \(Ana Pérez\)/);
  assert.match(sent[0].html, /Referido por: ana \(Ana Pérez\)/);
  const row = db.raw.prepare("SELECT ref_code, total_usd, budget_json FROM hire_leads").get() as { ref_code: string; total_usd: number; budget_json: string };
  assert.equal(row.ref_code, "ana");
  assert.equal(row.total_usd, 306); // 20 h x 18 = 360, -15% (Chico) = 306: the server's number, not the client's "total: 1"
  assert.equal(JSON.parse(row.budget_json).total, 306);
  assert.equal(JSON.parse(row.budget_json).privateUse, false); // stored inside budget_json, no migration

  // Private use: +500 in the stored total and flag inside budget_json; the referral base is that total.
  await handleHireContact({ ...base, budget: { ...base.budget, privateUse: true }, refCode: "ana" }, env, "1.1.1.1", deps);
  const priv = db.raw.prepare("SELECT total_usd, budget_json FROM hire_leads ORDER BY rowid DESC LIMIT 1").get() as { total_usd: number; budget_json: string };
  assert.equal(priv.total_usd, 806);
  assert.deepEqual([JSON.parse(priv.budget_json).privateUse, JSON.parse(priv.budget_json).total, JSON.parse(priv.budget_json).deposit], [true, 806, 403]);
  assert.match(sent.at(-1)!.text, /Uso privado: US\$ 500/);

  // Paused or unknown code: still sent and stored, just not attributed.
  for (const code of ["beto", "nadie", "<x>"]) {
    const r2 = await handleHireContact({ ...base, refCode: code }, env, "1.1.1.1", deps);
    assert.deepEqual(r2, { status: 200, body: { ok: true } }, code);
    assert.doesNotMatch(sent.at(-1)!.text, /Referido por/);
  }
  assert.equal(db.raw.prepare("SELECT count(*) AS n FROM hire_leads WHERE ref_code IS NULL").get()!.n, 3);
  // A D1 failure never blocks the message.
  const r3 = await handleHireContact(base, env, "x", { saveLead: async () => { throw new Error("d1 down"); } });
  assert.equal(r3.status, 200);
});
