import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyFromForm, handleHireContact, parseBudget } from "../src/lib/hire-contact.ts";

const budget = { mode: "project", days: 5, hoursPerDay: 4, hours: 1, complexity: "medium", onSite: true, onSiteDays: 2, extra: false };
const ok = { name: "Ana", email: "ana@example.com", message: "Hola, quiero una web.", budget, turnstileToken: "good-token" };
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function mkEnv(opts: { limitOk?: boolean; resend?: boolean } = {}) {
  const sent: unknown[] = [];
  const verified: URLSearchParams[] = [];
  const fetchMock = (async (u: string, init: RequestInit) => {
    if (u === SITEVERIFY) {
      const f = init.body as URLSearchParams;
      verified.push(f);
      return Response.json({ success: f.get("response") === "good-token" && f.get("secret") === "ts-secret" });
    }
    sent.push({ via: "resend", m: JSON.parse(String(init.body)) });
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;
  const env = {
    TURNSTILE_SECRET_KEY: "ts-secret",
    fetch: fetchMock,
    CONTACT_TO: "hola@lulox.com.ar",
    CONTACT_FROM: "no-responder@lulox.com.ar",
    CONTACT_RL: { limit: async () => ({ success: opts.limitOk ?? true }) },
    CONTACT_EMAIL: { send: async (m: unknown) => void sent.push({ via: "binding", m }) },
    ...(opts.resend
      ? { RESEND_API_KEY: "test-key" }
      : {}),
  };
  return { env, sent, verified };
}

test("valid submission sends via Resend with reply-to and server-computed budget", async () => {
  const { env, sent } = mkEnv({ resend: true });
  const r = await handleHireContact({ ...ok, budget: { ...budget, total: 1 } }, env, "1.1.1.1");
  assert.equal(r.status, 200);
  assert.equal(sent.length, 1);
  const { via, m } = sent[0] as { via: string; m: Record<string, unknown> };
  assert.equal(via, "resend");
  assert.deepEqual(m.to, ["hola@lulox.com.ar"]);
  assert.equal(m.from, "Portfolio <no-responder@lulox.com.ar>");
  assert.equal(m.reply_to, "ana@example.com");
  // 20h × 18 = 360, -15% = -54, on-site 2×25 + travel 2×25 = 100 → 406
  assert.match(String(m.text), /Total estimado: US\$ 406/);
  assert.match(String(m.text), /Presencial: sí, 2 días/);
});

test("falls back to send_email binding without Resend", async () => {
  const { env, sent } = mkEnv();
  assert.equal((await handleHireContact(ok, env, "x")).status, 200);
  assert.equal((sent[0] as { via: string }).via, "binding");
});

test("280 limit counts characters, not bytes", async () => {
  const { env, sent } = mkEnv();
  assert.equal((await handleHireContact({ ...ok, message: "ñ".repeat(280) }, env, "x")).status, 200);
  const r = await handleHireContact({ ...ok, message: "a".repeat(281) }, env, "x");
  assert.deepEqual([r.status, r.body.error], [400, "invalid_message"]);
  assert.equal(sent.length, 1);
});

test("validation: email, name, empty message, budget", async () => {
  const { env, sent } = mkEnv();
  for (const [patch, err] of [
    [{ email: "nope" }, "invalid_email"],
    [{ name: "  " }, "invalid_name"],
    [{ message: "   " }, "invalid_message"],
    [{ budget: { ...budget, mode: "hourly", hours: "lots" } }, "invalid_budget"],
    [{ budget: { ...budget, days: 21 } }, "invalid_budget"],
    [{ budget: { ...budget, hoursPerDay: 0 } }, "invalid_budget"],
    [{ budget: { ...budget, mode: "x" } }, "invalid_budget"],
  ] as const) {
    const r = await handleHireContact({ ...ok, ...patch }, env, "x");
    assert.deepEqual([r.status, r.body.error], [400, err]);
  }
  assert.equal(sent.length, 0);
});

test("honeypot pretends success and sends nothing", async () => {
  const { env, sent } = mkEnv();
  const r = await handleHireContact({ ...ok, website: "spam.com" }, env, "x");
  assert.equal(r.status, 200);
  assert.equal(sent.length, 0);
});

test("rate limit → 429, nothing sent", async () => {
  const { env, sent } = mkEnv({ limitOk: false });
  assert.equal((await handleHireContact(ok, env, "x")).status, 429);
  assert.equal(sent.length, 0);
});

test("no transport → 503; send failure → 502", async () => {
  assert.equal((await handleHireContact(ok, {}, "x")).status, 503);
  const { env } = mkEnv();
  const r = await handleHireContact(ok, { ...env, CONTACT_EMAIL: { send: async () => { throw new Error("x"); } } }, "x");
  assert.equal(r.status, 502);
});

test("parseBudget clamps on-site days to the project length and drops them when not on-site", () => {
  assert.equal(parseBudget({ ...budget, onSiteDays: 50 })?.onSiteDays, 5);
  assert.equal(parseBudget({ ...budget, days: 15, hoursPerDay: 1, onSiteDays: 50 })?.onSiteDays, 10);
  assert.equal(parseBudget({ ...budget, onSite: false })?.onSiteDays, 0);
  assert.equal(parseBudget({ ...budget, mode: "hourly", hours: 4 })?.onSiteDays, 1);
  assert.equal(parseBudget({ ...budget, mode: "hourly", hours: 4, onSite: false })?.onSiteDays, 0);
  assert.equal(parseBudget({ ...budget, days: 50 }), null);
});

test("Turnstile: missing or invalid token → 403, nothing sent; valid token is verified with secret + IP", async () => {
  const { env, sent, verified } = mkEnv({ resend: true });
  const noToken: Record<string, unknown> = { ...ok };
  delete noToken.turnstileToken;
  assert.deepEqual(await handleHireContact(noToken, env, "1.2.3.4"), { status: 403, body: { error: "captcha_failed" } });
  assert.equal((await handleHireContact({ ...ok, turnstileToken: "" }, env, "1.2.3.4")).status, 403);
  assert.equal((await handleHireContact({ ...ok, turnstileToken: "bad-token" }, env, "1.2.3.4")).status, 403);
  assert.equal(sent.length, 0);
  assert.equal((await handleHireContact(ok, env, "1.2.3.4")).status, 200);
  assert.equal(sent.length, 1);
  const last = verified.at(-1)!;
  assert.equal(last.get("remoteip"), "1.2.3.4");
  assert.equal(last.get("secret"), "ts-secret");
});

test("Turnstile: no secret configured → 503; siteverify down → 403", async () => {
  const { env, sent } = mkEnv();
  assert.equal((await handleHireContact(ok, { ...env, TURNSTILE_SECRET_KEY: undefined }, "x")).status, 503);
  const down = (async () => { throw new Error("net"); }) as unknown as typeof fetch;
  assert.equal((await handleHireContact(ok, { ...env, fetch: down }, "x")).status, 403);
  assert.equal(sent.length, 0);
});

test("default calculator quote is recomputed server-side to the same totals", async () => {
  for (const [b, total] of [
    [{ mode: "project", days: 2, hoursPerDay: 4, complexity: "low", onSite: false, extra: false, total: 9999 }, "US$ 80"],
    [{ mode: "hourly", hours: 2, complexity: "low", onSite: false, days: 1, extra: false }, "US$ 20"],
  ] as const) {
    const { env, sent } = mkEnv({ resend: true });
    assert.equal((await handleHireContact({ ...ok, budget: b }, env, "x")).status, 200);
    const text = String((sent[0] as { m: { text: string } }).m.text);
    assert.match(text, new RegExp(`Total estimado: ${total.replace("$", "\\$")}\\n`));
    assert.match(text, /Presencial: no/);
    assert.match(text, /Urgencia: no/);
  }
});

test("urgency: server forces 1 day in hourly mode, recomputes project days; client totals ignored", async () => {
  for (const [b, total, line] of [
    [{ mode: "hourly", hours: 2, complexity: "low", onSite: false, days: 0, extra: true, extraDays: 3, total: 1 }, "US$ 120", "Urgencia: sí\n"],
    [{ mode: "project", days: 2, hoursPerDay: 4, complexity: "low", onSite: true, onSiteDays: 2, extra: true, extraDays: 2, total: 9999 }, "US$ 380", "Urgencia: sí, 2 días"],
    [{ mode: "project", days: 10, hoursPerDay: 1, complexity: "low", onSite: false, extra: true, extraDays: 999 }, "US$ 1,100", "Urgencia: sí, 10 días"],
  ] as const) {
    const { env, sent } = mkEnv({ resend: true });
    assert.equal((await handleHireContact({ ...ok, budget: b }, env, "x")).status, 200);
    const text = String((sent[0] as { m: { text: string } }).m.text);
    assert.match(text, new RegExp(`Total estimado: ${total.replace("$", "\\$")}\\n`));
    assert.ok(text.includes(line), text);
    if (b.mode === "hourly") assert.ok(!/Urgencia \(|días?\b/.test(text.replace(/^Modalidad: .*$/m, "")), text);
  }
});

test("parseBudget: urgency off → 0 days; missing days → 1", () => {
  assert.equal(parseBudget({ ...budget, extra: false, extraDays: 5 })!.extraDays, 0);
  assert.equal(parseBudget({ ...budget, extra: true })!.extraDays, 1);
  assert.equal(parseBudget({ ...budget, mode: "hourly", extra: true, extraDays: 7 })!.extraDays, 1);
  assert.equal(parseBudget({ ...budget, mode: "project", extra: true, extraDays: 7 })!.extraDays, 5); // clamped to the 5 project days
  assert.equal(parseBudget({ ...budget, days: 12, hoursPerDay: 1, extra: true, extraDays: 7 })!.extraDays, 7);
  assert.equal(parseBudget({ ...budget, days: 20, hoursPerDay: 1, extra: true, extraDays: 99 })!.extraDays, 10);
});

test("native form post: fields map to the JSON shape, Turnstile token included", () => {
  const b = bodyFromForm([
    ["name", "Ana"], ["email", "ana@example.com"], ["message", "Hola"], ["hire_hp", ""],
    ["budget.mode", "project"], ["budget.hours", "4"], ["budget.complexity", "low"], ["budget.onSite", "false"], ["budget.extra", "true"],
    ["cf-turnstile-response", "good-token"], ["evil", "x"],
  ]);
  assert.deepEqual(b, {
    name: "Ana", email: "ana@example.com", message: "Hola", hire_hp: "", turnstileToken: "good-token",
    budget: { mode: "project", hours: 4, complexity: "low", onSite: false, extra: true },
  });
});

test("hire_hp honeypot also pretends success; 281 chars rejected server-side", async () => {
  const { env, sent } = mkEnv({ resend: true });
  assert.deepEqual(await handleHireContact({ ...ok, hire_hp: "http://spam" }, env, "x"), { status: 200, body: { ok: true } });
  assert.equal((await handleHireContact({ ...ok, message: "a".repeat(281) }, env, "x")).status, 400);
  assert.equal((await handleHireContact({ ...ok, message: "😀".repeat(280) }, env, "x")).status, 200);
  assert.equal(sent.length, 1);
});

test("server clamps hourly hours; project days × hours/day are strict and client hours are ignored", () => {
  assert.equal(parseBudget({ ...budget, mode: "hourly", hours: 9 })?.hours, 6);
  assert.equal(parseBudget({ ...budget, mode: "hourly", hours: 0 })?.hours, 1);
  assert.equal(parseBudget({ ...budget, hours: 99 })?.hours, 20);
  assert.equal(parseBudget({ ...budget, hours: "lots" })?.hours, 20);
  assert.equal(parseBudget({ ...budget, days: 3, hoursPerDay: 4, hours: 1 })?.hours, 12);
  for (const bad of [0, 21, 1.5, "3", null, 1.0 + 0.2]) {
    assert.equal(parseBudget({ ...budget, days: bad }), null, JSON.stringify(bad));
  }
  for (const bad of [0, 7, 1.5, "4", null, true]) {
    assert.equal(parseBudget({ ...budget, hoursPerDay: bad }), null, JSON.stringify(bad));
  }
  const noDays = { ...budget } as Record<string, unknown>;
  delete noDays.days;
  const noPer = { ...budget } as Record<string, unknown>;
  delete noPer.hoursPerDay;
  assert.equal(parseBudget(noDays), null);
  assert.equal(parseBudget(noPer), null);
});

test("project email breakdown: 3 days × 4 h at the low rate, singular day, client total ignored", async () => {
  const { env, sent } = mkEnv({ resend: true });
  assert.equal((await handleHireContact({
    ...ok,
    budget: { mode: "project", days: 3, hoursPerDay: 4, hours: 99, complexity: "low", onSite: false, extra: false, total: 1 },
  }, env, "x")).status, 200);
  const text = String((sent[0] as { m: { text: string } }).m.text);
  assert.match(text, /Desglose: 3 días × 4 h\/día = 12 h · US\$ 120/);
  assert.match(text, /Total estimado: US\$ 120\n/);
  const one = mkEnv({ resend: true });
  assert.equal((await handleHireContact({
    ...ok,
    budget: { mode: "project", days: 1, hoursPerDay: 4, complexity: "low", onSite: false, extra: false, total: 9 },
  }, one.env, "x")).status, 200);
  assert.match(String((one.sent[0] as { m: { text: string } }).m.text), /Desglose: 1 día × 4 h\/día = 4 h · US\$ 40/);
});

test("project days or hoursPerDay out of range → 400 invalid_budget, nothing sent", async () => {
  const { env, sent } = mkEnv({ resend: true });
  for (const bad of [{ days: 21 }, { days: 0 }, { hoursPerDay: 7 }, { hoursPerDay: 1.2 }]) {
    const r = await handleHireContact({ ...ok, budget: { ...budget, ...bad } }, env, "x");
    assert.deepEqual([r.status, r.body.error], [400, "invalid_budget"], JSON.stringify(bad));
  }
  assert.equal(sent.length, 0);
});

test("parseBudget privateUse: strict boolean, missing (old payload) = false, anything else rejects", () => {
  assert.equal(parseBudget(budget)!.privateUse, false); // old payload without the key
  assert.equal(parseBudget({ ...budget, privateUse: false })!.privateUse, false);
  assert.equal(parseBudget({ ...budget, privateUse: true })!.privateUse, true);
  assert.equal(parseBudget({ ...budget, privateUse: undefined })!.privateUse, false);
  for (const bad of ["true", "yes", 1, 0, null, {}, []]) assert.equal(parseBudget({ ...budget, privateUse: bad }), null, JSON.stringify(bad));
});

test("private use: +US$ 500 per project / +US$ 200 per hour recomputed server-side, own line in the email, invalid flag → 400", async () => {
  for (const [b, total, deposit, fee] of [
    // 20h × 18 = 360, -15% = -54, on-site 2 days = 100, private 500 → 906
    [{ ...budget, privateUse: true, total: 1 }, "US$ 906", "US$ 453", "US$ 500"],
    [{ mode: "hourly", hours: 2, complexity: "low", onSite: false, days: 0, extra: false, privateUse: true }, "US$ 220", "US$ 110", "US$ 200"],
  ] as const) {
    const { env, sent } = mkEnv({ resend: true });
    assert.equal((await handleHireContact({ ...ok, budget: b }, env, "x")).status, 200);
    const { text, html } = (sent[0] as { m: { text: string; html: string } }).m;
    assert.match(text, new RegExp(`Total estimado: ${total.replace("$", "\\$")}\\n`));
    assert.match(text, new RegExp(`Anticipo \\(50%\\): ${deposit.replace("$", "\\$")}\\n`));
    assert.match(text, new RegExp(`\\nUso privado: ${fee.replace("$", "\\$")}\\n`));
    assert.match(text, /Uso privado: sí/);
    assert.match(html, /Uso privado/);
  }
  const { env, sent } = mkEnv({ resend: true });
  assert.equal((await handleHireContact(ok, env, "x")).status, 200);
  assert.match(String((sent[0] as { m: { text: string } }).m.text), /Uso privado: no/);
  assert.doesNotMatch(String((sent[0] as { m: { text: string } }).m.text), /Uso privado: US\$/);
  const r = await handleHireContact({ ...ok, budget: { ...budget, privateUse: "true" } }, env, "x");
  assert.deepEqual([r.status, r.body.error], [400, "invalid_budget"]);
  assert.equal(sent.length, 1);
});

test("native form post carries budget.privateUse as a boolean", () => {
  assert.deepEqual(bodyFromForm([["budget.privateUse", "true"]]).budget, { privateUse: true });
  assert.deepEqual(bodyFromForm([["budget.privateUse", "false"]]).budget, { privateUse: false });
});

test("forward to Garpen: called once after the email went out, with the recomputed budget; never on rejects or send failure", async () => {
  const m = mkEnv();
  const got: unknown[] = [];
  const r = await handleHireContact(ok, m.env as never, "1.1.1.1", { forward: (i) => void got.push(i) });
  assert.equal(r.status, 200);
  assert.equal(m.sent.length, 1);
  assert.equal(got.length, 1);
  const f = got[0] as { name: string; email: string; message: string; budget: { total: number }; refCode: string | null };
  assert.equal(f.name, "Ana");
  assert.equal(f.email, "ana@example.com");
  assert.equal(typeof f.budget.total, "number");
  assert.equal(f.refCode, null);

  const bad: unknown[] = [];
  assert.equal((await handleHireContact({ ...ok, email: "nope" }, mkEnv().env as never, "x", { forward: (i) => void bad.push(i) })).status, 400);
  assert.equal((await handleHireContact({ ...ok, turnstileToken: "bad" }, mkEnv().env as never, "x", { forward: (i) => void bad.push(i) })).status, 403);
  assert.equal((await handleHireContact({ ...ok, website: "bot" }, mkEnv().env as never, "x", { forward: (i) => void bad.push(i) })).status, 200);
  const failing = mkEnv({ resend: true });
  (failing.env as { fetch: unknown }).fetch = (async (u: string) => (u === SITEVERIFY ? Response.json({ success: true }) : new Response("no", { status: 500 }))) as unknown as typeof fetch;
  assert.equal((await handleHireContact(ok, failing.env as never, "x", { forward: (i) => void bad.push(i) })).status, 502);
  assert.equal(bad.length, 0);
});

test("forward to Garpen: a throwing forward never changes the visitor's success", async () => {
  const m = mkEnv();
  const r = await handleHireContact(ok, m.env as never, "1.1.1.1", { forward: () => { throw new Error("serpix down"); } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true });
  assert.equal(m.sent.length, 1);
});
