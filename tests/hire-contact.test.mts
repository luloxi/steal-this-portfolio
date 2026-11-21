import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyFromForm, handleHireContact, parseUtm } from "../src/lib/hire-contact.ts";

const ok = { name: "Ana", email: "ana@example.com", message: "Hola, quiero automatizar el correo.", turnstileToken: "good-token" };
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
    CONTACT_TO: "info@lulox.com.ar",
    CONTACT_FROM: "no-responder@lulox.com.ar",
    CONTACT_RL: { limit: async () => ({ success: opts.limitOk ?? true }) },
    CONTACT_EMAIL: { send: async (m: unknown) => void sent.push({ via: "binding", m }) },
    ...(opts.resend
      ? { RESEND_API_KEY: "test-key" }
      : {}),
  };
  return { env, sent, verified };
}

test("valid submission sends via Resend with reply-to, no amounts, and the utm tags", async () => {
  const { env, sent } = mkEnv({ resend: true });
  const r = await handleHireContact({ ...ok, utm: { utm_source: "linkedin", utm_campaign: "otono", foo: "x" } }, env, "1.1.1.1");
  assert.equal(r.status, 200);
  assert.equal(sent.length, 1);
  const { via, m } = sent[0] as { via: string; m: Record<string, unknown> };
  assert.equal(via, "resend");
  assert.deepEqual(m.to, ["info@lulox.com.ar"]);
  assert.equal(m.reply_to, "ana@example.com");
  assert.equal(m.subject, "Contratar: Ana");
  assert.match(String(m.text), /Campaña: utm_source=linkedin, utm_campaign=otono/);
  assert.doesNotMatch(String(m.text), /US\$|Presupuesto|foo/);
});

test("falls back to send_email binding without Resend", async () => {
  const { env, sent } = mkEnv();
  assert.equal((await handleHireContact(ok, env, "x")).status, 200);
  assert.equal((sent[0] as { via: string }).via, "binding");
});

test("1000 limit counts characters, not bytes", async () => {
  const { env } = mkEnv();
  assert.equal((await handleHireContact({ ...ok, message: "ñ".repeat(1000) }, env, "x")).status, 200);
  assert.equal((await handleHireContact({ ...ok, message: "😀".repeat(1000) }, env, "x")).status, 200);
  const r = await handleHireContact({ ...ok, message: "a".repeat(1001) }, env, "x");
  assert.deepEqual([r.status, r.body.error], [400, "invalid_message"]);
});

test("validation: name, email, empty message", async () => {
  const { env, sent } = mkEnv();
  assert.equal((await handleHireContact({ ...ok, name: " " }, env, "x")).body.error, "invalid_name");
  assert.equal((await handleHireContact({ ...ok, email: "nope" }, env, "x")).body.error, "invalid_email");
  assert.equal((await handleHireContact({ ...ok, message: "  " }, env, "x")).body.error, "invalid_message");
  assert.equal(sent.length, 0);
});

test("honeypots pretend success and send nothing", async () => {
  const { env, sent } = mkEnv();
  assert.equal((await handleHireContact({ ...ok, website: "x" }, env, "x")).status, 200);
  assert.equal((await handleHireContact({ ...ok, hire_hp: "x" }, env, "x")).status, 200);
  assert.equal(sent.length, 0);
});

test("rate limit → 429, nothing sent", async () => {
  const { env, sent } = mkEnv({ limitOk: false });
  assert.equal((await handleHireContact(ok, env, "x")).status, 429);
  assert.equal(sent.length, 0);
});

test("Turnstile: invalid token → 403; no secret → 503", async () => {
  const { env, sent } = mkEnv();
  assert.equal((await handleHireContact({ ...ok, turnstileToken: "bad" }, env, "x")).status, 403);
  const { TURNSTILE_SECRET_KEY: _drop, ...noSecret } = env;
  void _drop;
  assert.equal((await handleHireContact(ok, noSecret, "x")).status, 503);
  assert.equal(sent.length, 0);
});

test("Garpen forward and lead get the message and utm, never amounts", async () => {
  const { env } = mkEnv();
  const forwarded: unknown[] = [];
  const leads: { budgetJson: string; totalUsd: number }[] = [];
  await handleHireContact({ ...ok, utm: { utm_source: "x" } }, env, "x", {
    forward: (i) => void forwarded.push(i),
    saveLead: async (l) => void leads.push(l),
  });
  assert.deepEqual(forwarded[0], { name: "Ana", email: "ana@example.com", message: "Hola, quiero automatizar el correo.", budget: { utm: { utm_source: "x" } }, refCode: null });
  assert.deepEqual([leads[0].budgetJson, leads[0].totalUsd], ['{"utm":{"utm_source":"x"}}', 0]);
  forwarded.length = 0;
  await handleHireContact(ok, env, "x", { forward: (i) => void forwarded.push(i) });
  assert.equal((forwarded[0] as { budget: unknown }).budget, null);
});

test("parseUtm keeps only utm_* strings", () => {
  assert.deepEqual(parseUtm({ utm_source: " ig ", gclid: "1", utm_x: 3, utm_medium: "a".repeat(121) }), { utm_source: "ig" });
  assert.deepEqual(parseUtm("nope"), {});
});

test("native form post: fields map to the JSON shape, Turnstile token and utm included", () => {
  const b = bodyFromForm([["name", "Ana"], ["email", "a@b.co"], ["message", "hola"], ["cf-turnstile-response", "tok"], ["utm_source", "x"], ["budget.mode", "project"]]);
  assert.deepEqual(b, { name: "Ana", email: "a@b.co", message: "hola", turnstileToken: "tok", utm: { utm_source: "x" } });
});
