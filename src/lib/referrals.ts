/**
 * Referral program (pure helpers, no Next/D1 imports): codes, the lulox-ref
 * cookie, payouts. Whoever brings a client earns REFERRAL_PCT of what that
 * client pays. Used by proxy.ts, the API routes, the pages and tests.
 */
import { DEFAULT_SITE } from "@/lib/site-settings";

export const REFERRAL_PCT = 15;
export const REF_COOKIE = "lulox-ref";
export const REF_PARAM = "ref";
export const REF_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
export const CODE_MIN = 3;
export const CODE_MAX = 24;
/** a-z, 0-9 and single inner hyphens ("ana-dev", not "-ana", "ana--dev" or "ana-"). */
export const CODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Codes nobody can take: site routes and words that could pass as official.
 * Compared after normalizing, and also with the hyphens removed ("a-d-m-i-n").
 */
export const RESERVED_CODES: ReadonlySet<string> = new Set([
  "admin", "administrador", "administrator", "root", "api", "app", "www", "mail", "email", "smtp",
  "en", "es", "lulox", "luloxi", "luloxdev", "luciano", "lucianooliva", "olivabianco", "bianco",
  "contratar", "hire", "blog", "proyectos", "projects", "sobre-mi", "about", "contacto", "contact",
  "privacidad", "privacy", "ingresar", "sign-in", "signin", "login", "logout", "referidos", "referrals",
  "referido", "referral", "ref", "media", "static", "assets", "sitemap", "robots",
  "soporte", "support", "help", "ayuda", "hola", "info", "staff", "team", "equipo", "oficial", "official",
  "mod", "moderator", "system", "sistema", "test", "null", "undefined", "none", "anon", "anonymous",
]);

export type CodeCheck = { ok: true; code: string } | { ok: false; error: "invalid" | "reserved" };

/** Trim + lowercase (codes are case-insensitive and stored lowercase). */
export function normalizeCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function checkCodeShape(raw: unknown): CodeCheck {
  const code = normalizeCode(raw);
  if (code.length < CODE_MIN || code.length > CODE_MAX || !CODE_RE.test(code)) return { ok: false, error: "invalid" };
  if (RESERVED_CODES.has(code) || RESERVED_CODES.has(code.replace(/-/g, ""))) return { ok: false, error: "reserved" };
  return { ok: true, code };
}

/** Code from a Cookie header (null when missing or malformed). */
export function refFromCookie(cookieHeader: string | null | undefined): string | null {
  const m = new RegExp(`(?:^|;\\s*)${REF_COOKIE}=([^;]*)`).exec(cookieHeader ?? "");
  if (!m) return null;
  let v = m[1];
  try {
    v = decodeURIComponent(v);
  } catch {
    return null;
  }
  const c = normalizeCode(v);
  return c.length <= CODE_MAX && CODE_RE.test(c) ? c : null;
}

/** Set-Cookie value for the browser (JS-readable: the hire page shows "Referido por"). */
export function refCookie(code: string, secure: boolean): string {
  return `${REF_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${REF_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Share links for a code, in both languages. `base` is the public site URL. */
export function shareLinks(code: string, base = DEFAULT_SITE.url): { es: string; en: string } {
  const root = base.replace(/\/$/, "");
  const c = encodeURIComponent(code);
  return { es: `${root}/contratar?${REF_PARAM}=${c}`, en: `${root}/en/hire?${REF_PARAM}=${c}` };
}

/* ---------- people ---------- */

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
export const isEmail = (s: string) => s.length <= 254 && EMAIL_RE.test(s);
export const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * WhatsApp: optional. Keeps a leading + and the digits; 8 to 15 digits (E.164).
 * "" = not given; null = given but not a phone number.
 */
export function normalizeWhatsapp(raw: unknown): string | null {
  if (raw == null) return "";
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return "";
  if (!/^\+?[\d\s().-]+$/.test(s)) return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `${s.startsWith("+") ? "+" : ""}${digits}`;
}

/** https://wa.me/<digits> (no +), or null. */
export function waLink(whatsapp: string | null | undefined, text?: string): string | null {
  const d = (whatsapp ?? "").replace(/\D/g, "");
  if (!d) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/* ---------- money ---------- */

export type Currency = "ARS" | "USD";
export const CURRENCIES: readonly Currency[] = ["ARS", "USD"];
export type PayoutStatus = "pending" | "paid";

/** REFERRAL_PCT of an amount, both in cents, rounded to the cent. */
export function payoutCents(amountCents: number): number {
  return Math.round((amountCents * REFERRAL_PCT) / 100);
}

/**
 * "150000", "150000.5", "150.000,50", "1,234.56" -> cents. Up to 2 decimals,
 * max 1e12 (ten billion). null when it isn't a positive-or-zero amount.
 */
export function parseAmountCents(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 && raw < 1e10 ? Math.round(raw * 100) : null;
  if (typeof raw !== "string") return null;
  let s = raw.trim().replace(/\s|\$/g, "");
  if (!s || !/^[\d.,]+$/.test(s)) return null;
  const lastSep = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
  // A last separator followed by 1-2 digits is the decimal mark; the rest are thousands.
  if (lastSep >= 0 && s.length - lastSep - 1 <= 2) {
    s = s.slice(0, lastSep).replace(/[.,]/g, "") + "." + s.slice(lastSep + 1);
  } else {
    s = s.replace(/[.,]/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 1e10 ? Math.round(n * 100) : null;
}

export function formatCents(cents: number, currency: Currency): string {
  const v = (cents / 100).toLocaleString("es-AR", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return `${currency === "USD" ? "US$" : "AR$"} ${v}`;
}

export type PayoutLike = { currency: Currency; payout_cents: number; status: PayoutStatus } | null | undefined;
export type Totals = Record<Currency, { pending: number; paid: number }>;

/** Owed (pending) and already paid payouts, per currency, in cents. */
export function payoutTotals(payouts: readonly PayoutLike[]): Totals {
  const t: Totals = { ARS: { pending: 0, paid: 0 }, USD: { pending: 0, paid: 0 } };
  for (const p of payouts) {
    if (!p || !(p.currency in t)) continue;
    t[p.currency][p.status === "paid" ? "paid" : "pending"] += p.payout_cents;
  }
  return t;
}

/** Internal path to come back to after sign-in (open redirects refused). */
export function safeNext(raw: unknown, fallback = "/blog"): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.length > 200) return fallback;
  return raw;
}
