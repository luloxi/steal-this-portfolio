import { charCount, MAX_MESSAGE } from "./hire-limits";
import { checkCodeShape } from "./referrals";

export { MAX_MESSAGE };

/**
 * Contact form: name, email and message (max MAX_MESSAGE characters).
 * Sends one email via Resend (RESEND_API_KEY), falling back to the Email Routing
 * `send_email` binding, then forwards a copy to Garpen. Every send needs a valid
 * Cloudflare Turnstile token, checked server-side via siteverify (TURNSTILE_SECRET_KEY).
 * The visit's utm_* tags (if any) travel with the message.
 */
export type HireEnv = {
  CONTACT_EMAIL?: { send: (msg: unknown) => Promise<unknown> };
  CONTACT_RL?: { limit: (o: { key: string }) => Promise<{ success: boolean }> };
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  /** Preferred transport (Worker secret). */
  RESEND_API_KEY?: string;
  /** Turnstile secret (Worker secret). Without it the form refuses to send. */
  TURNSTILE_SECRET_KEY?: string;
  fetch?: typeof fetch;
};

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const UTM_KEY = /^utm_[a-z0-9_]{1,40}$/;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** utm_* tags from the request: only utm_ keys, string values up to 120 chars, max 8 keys. Anything else is dropped. */
export function parseUtm(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (Object.keys(out).length >= 8) break;
    if (!UTM_KEY.test(k) || typeof raw !== "string") continue;
    const val = oneLine(raw);
    if (val && val.length <= 120) out[k] = val;
  }
  return out;
}

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True only if Cloudflare confirms the Turnstile token. Fails closed. */
export async function verifyTurnstile(token: unknown, env: HireEnv, ip: string): Promise<boolean> {
  if (typeof token !== "string" || !token || token.length > 2048 || !env.TURNSTILE_SECRET_KEY) return false;
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip && ip !== "unknown") form.set("remoteip", ip);
  try {
    const r = await (env.fetch ?? fetch)(SITEVERIFY, { method: "POST", body: form });
    const j = (await r.json()) as { success?: boolean };
    return r.ok && j.success === true;
  } catch {
    return false;
  }
}

export type Result = { status: number; body: Record<string, unknown> };

export type HireDeps = {
  /** Active referrer for a normalized code, or null. */
  findReferrer?: (code: string) => Promise<{ id: string; code: string; name: string } | null>;
  /**
   * Fire-and-forget copy to Garpen (inbox + push), called AFTER the email went out. It must not throw or block:
   * the route schedules the request with ctx.waitUntil and swallows failures. `budget` carries only { utm } now.
   */
  forward?: (inquiry: { name: string; email: string; message: string; budget: { utm: Record<string, string> } | null; refCode: string | null }) => void;
  /** Store the lead after the email went out (referrals). Errors are logged, never shown to the visitor. */
  saveLead?: (lead: { name: string; email: string; message: string; budgetJson: string; totalUsd: number; refCode: string | null; referrerId: string | null }) => Promise<unknown>;
  /** From-name on the email. Missing = a generic label. */
  fromName?: string;
  /** Public site URL, used in the footer ("sent from host/contacto"). */
  publicUrl?: string;
};

export async function handleHireContact(raw: unknown, env: HireEnv, ip: string, deps: HireDeps = {}): Promise<Result> {
  if (!raw || typeof raw !== "object") return { status: 400, body: { error: "invalid_json" } };
  const body = raw as Record<string, unknown>;
  // Honeypot: bots fill hidden fields. Pretend success, send nothing.
  for (const hp of [body.website, body.hire_hp]) if (typeof hp === "string" && hp.trim() !== "") return { status: 200, body: { ok: true } };

  const name = typeof body.name === "string" ? oneLine(body.name).slice(0, 80) : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!name) return { status: 400, body: { error: "invalid_name" } };
  if (!EMAIL_RE.test(email) || email.length > 254) return { status: 400, body: { error: "invalid_email" } };
  if (!message || charCount(message) > MAX_MESSAGE) return { status: 400, body: { error: "invalid_message" } };
  const utm = parseUtm(body.utm);

  if (env.CONTACT_RL) {
    const { success } = await env.CONTACT_RL.limit({ key: `hire:${ip}` });
    if (!success) return { status: 429, body: { error: "rate_limited" } };
  }
  if (!env.TURNSTILE_SECRET_KEY || (!env.RESEND_API_KEY && !env.CONTACT_EMAIL)) return { status: 503, body: { error: "not_configured" } };
  if (!(await verifyTurnstile(body.turnstileToken, env, ip))) return { status: 403, body: { error: "captcha_failed" } };

  // Referral code prefilled from the lulox-ref cookie or ?ref=: only an active referrer counts.
  // An unknown or paused code never blocks the message; it is just not attributed.
  let referrer: { id: string; code: string; name: string } | null = null;
  const shape = checkCodeShape(body.refCode);
  if (shape.ok && deps.findReferrer) {
    try {
      referrer = await deps.findReferrer(shape.code);
    } catch {
      console.error("[hire-contact] referrer lookup failed");
    }
  }

  const refLine = referrer ? `Referido por: ${referrer.code} (${oneLine(referrer.name)})` : null;
  const utmLine = Object.keys(utm).length ? `Campaña: ${Object.entries(utm).map(([k, v]) => `${k}=${v}`).join(", ")}` : null;
  const to = env.CONTACT_TO ?? "info@lulox.com.ar";
  const from = env.CONTACT_FROM ?? "no-responder@lulox.com.ar";
  const fromName = (deps.fromName ?? "Portfolio").trim() || "Portfolio";
  let publicHost = "example.com";
  try {
    publicHost = new URL(deps.publicUrl || "https://example.com").host;
  } catch {
    publicHost = "example.com";
  }
  const subject = `Contratar: ${name}`;
  const extra = [refLine, utmLine].filter(Boolean) as string[];
  const text = [
    `${name} <${email}>`,
    "",
    message,
    ...(extra.length ? ["", ...extra] : []),
    "",
    "--",
    `Enviado desde ${publicHost}/contacto. Respondé este email para contestarle a ${email}.`,
  ].join("\n");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(subject)}</title></head><body><div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1a1a1a;max-width:560px">
<p style="margin:0 0 4px;font-weight:700">${esc(name)} &lt;${esc(email)}&gt;</p>
<p style="font-size:17px;line-height:1.5;white-space:pre-wrap;margin:12px 0 24px">${esc(message)}</p>
${extra.map((l) => `<p style="margin:0 0 6px;font-size:14px;color:#0F766E">${esc(l)}</p>`).join("")}
<p style="font-size:12px;color:#666;margin-top:24px">Enviado desde ${esc(publicHost)}/contacto. Respondé este email para contestarle a ${esc(email)}.</p>
</div></body></html>`;

  try {
    if (env.RESEND_API_KEY) {
      const r = await (env.fetch ?? fetch)("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `${fromName} <${from}>`, to: [to], reply_to: email, subject, html, text }),
      });
      if (!r.ok) throw new Error(`resend ${r.status}`);
    } else {
      await env.CONTACT_EMAIL!.send({ from: { email: from, name: fromName }, to, replyTo: { email, name }, subject, html, text });
    }
  } catch {
    console.error("[hire-contact] send failed");
    return { status: 502, body: { error: "send_failed" } };
  }
  const meta = Object.keys(utm).length ? { utm } : null;
  if (deps.forward) {
    try {
      deps.forward({ name, email, message, budget: meta, refCode: referrer?.code ?? null });
    } catch {
      console.error("[hire-contact] forward failed");
    }
  }
  if (deps.saveLead) {
    try {
      await deps.saveLead({ name, email, message, budgetJson: JSON.stringify(meta ?? {}), totalUsd: 0, refCode: referrer?.code ?? null, referrerId: referrer?.id ?? null });
    } catch {
      console.error("[hire-contact] lead not stored");
    }
  }
  return { status: 200, body: { ok: true, ...(referrer ? { ref: referrer.code } : {}) } };
}

/**
 * Native <form method="post"> fallback (no fetch): maps urlencoded/multipart fields to the JSON
 * shape. Turnstile injects its token as `cf-turnstile-response`; it is still verified server-side.
 */
export function bodyFromForm(entries: Iterable<[string, unknown]>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const utm: Record<string, string> = {};
  for (const [k, raw] of entries) {
    if (typeof raw !== "string") continue;
    if (UTM_KEY.test(k)) utm[k] = raw;
    else if (k === "cf-turnstile-response") out.turnstileToken = raw;
    else if (k === "ref_code") out.refCode = raw;
    else if (["name", "email", "message", "hire_hp", "turnstileToken", "next"].includes(k)) out[k] = raw;
  }
  out.utm = utm;
  return out;
}
