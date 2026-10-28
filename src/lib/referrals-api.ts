/**
 * Referral API logic, independent of Next (routes in src/app/api/** are thin
 * wrappers). Every handler gets the viewer decided server-side from the
 * Better Auth session (never from the request body), so permissions are
 * testable: anonymous -> 401, signed in but not admin -> 403 on admin calls,
 * and "my" data is always looked up by the viewer's own user id.
 */
import type { D1Database } from "@/lib/db";
import {
  CURRENCIES,
  checkCodeShape,
  isEmail,
  normalizeWhatsapp,
  oneLine,
  parseAmountCents,
  shareLinks,
  type Currency,
} from "@/lib/referrals";
import {
  createReferrer,
  getMyReferral,
  getReferrerByCode,
  getReferrerByUserId,
  listReferrersWithLeads,
  setReferrerActive,
  upsertPayout,
} from "@/lib/referrals-db";

export type Viewer = { id: string; email: string; name: string; isAdmin: boolean } | null;
export type ApiResult = { status: number; body: Record<string, unknown> };

const err = (status: number, error: string): ApiResult => ({ status, body: { error } });

/** 401 without a session, 403 for a signed-in non-admin, null = go on. */
export function adminGate(viewer: Viewer): ApiResult | null {
  if (!viewer) return err(401, "unauthorized");
  if (!viewer.isAdmin) return err(403, "forbidden");
  return null;
}

/** Live availability for the signup form (and "is this code valid?" for the hire page). */
export async function checkCode(raw: unknown, db: D1Database): Promise<ApiResult> {
  const shape = checkCodeShape(raw);
  if (!shape.ok) return { status: 200, body: { status: shape.error } };
  const r = await getReferrerByCode(db, shape.code);
  return { status: 200, body: r ? { status: "taken", code: shape.code, active: r.active === 1 } : { status: "available", code: shape.code } };
}

export type SignupDeps = {
  db: D1Database;
  /** Rate limit (CONTACT_RL); true = allowed. */
  limit?: () => Promise<boolean>;
  /** Referrals section hidden from the admin strip: closed to everyone but the admin. */
  sectionHidden?: boolean;
  /** Public site origin for the share links. Missing = the neutral default. */
  siteUrl?: string;
};

/**
 * Create the viewer's code. Requires a Google session: name comes from the
 * form (prefilled from Google), the email is the account's own address.
 * One code per account (referrers.user_id is unique).
 */
export async function signup(viewer: Viewer, raw: unknown, deps: SignupDeps): Promise<ApiResult> {
  if (!viewer) return err(401, "sign_in_required");
  if (deps.sectionHidden && !viewer.isAdmin) return err(404, "not_found");
  if (!raw || typeof raw !== "object") return err(400, "invalid_json");
  const body = raw as Record<string, unknown>;
  if (deps.limit && !(await deps.limit())) return err(429, "rate_limited");

  const name = typeof body.name === "string" ? oneLine(body.name).slice(0, 80) : "";
  if (!name) return err(400, "invalid_name");
  const email = viewer.email.trim().toLowerCase();
  if (!isEmail(email)) return err(400, "invalid_email");
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  if (whatsapp === null) return err(400, "invalid_whatsapp");
  const shape = checkCodeShape(body.code);
  if (!shape.ok) return err(400, shape.error === "reserved" ? "code_reserved" : "code_invalid");

  const existing = await getReferrerByUserId(deps.db, viewer.id);
  if (existing) return { status: 409, body: { error: "already_has_code", code: existing.code } };
  if (await getReferrerByCode(deps.db, shape.code)) return err(409, "code_taken");
  const r = await createReferrer(deps.db, { name, email, whatsapp: whatsapp || null, code: shape.code, userId: viewer.id });
  if (!r.ok) return err(409, r.error);
  return { status: 200, body: { ok: true, code: shape.code, links: shareLinks(shape.code, deps.siteUrl) } };
}

/** The viewer's own code and totals. There is no parameter to ask for someone else's. */
export async function myReferral(viewer: Viewer, db: D1Database, siteUrl?: string): Promise<ApiResult> {
  if (!viewer) return err(401, "unauthorized");
  const mine = await getMyReferral(db, viewer.id);
  return { status: 200, body: { referral: mine, links: mine ? shareLinks(mine.referrer.code, siteUrl) : null } };
}

export async function adminList(viewer: Viewer, db: D1Database): Promise<ApiResult> {
  const gate = adminGate(viewer);
  if (gate) return gate;
  return { status: 200, body: { referrers: await listReferrersWithLeads(db) } };
}

/** Admin: { currency: "ARS" | "USD", amount: "150000" | number, status: "pending" | "paid" }. */
export async function adminUpdatePayout(viewer: Viewer, leadId: string, raw: unknown, db: D1Database): Promise<ApiResult> {
  const gate = adminGate(viewer);
  if (gate) return gate;
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const currency = CURRENCIES.find((c) => c === body.currency) as Currency | undefined;
  if (!currency) return err(400, "invalid_currency");
  const amountCents = parseAmountCents(body.amount);
  if (amountCents === null) return err(400, "invalid_amount");
  const status = body.status === "paid" ? "paid" : body.status === "pending" || body.status === undefined ? "pending" : null;
  if (!status) return err(400, "invalid_status");
  const p = await upsertPayout(db, leadId, { currency, amountCents, status });
  if (!p) return err(404, "lead_not_found");
  return { status: 200, body: { ok: true, payout: p } };
}

/** Admin: { active: boolean }. Deactivating keeps the row and its leads. */
export async function adminSetActive(viewer: Viewer, referrerId: string, raw: unknown, db: D1Database): Promise<ApiResult> {
  const gate = adminGate(viewer);
  if (gate) return gate;
  const active = (raw as { active?: unknown } | null)?.active;
  if (typeof active !== "boolean") return err(400, "invalid_active");
  if (!(await setReferrerActive(db, referrerId, active))) return err(404, "referrer_not_found");
  return { status: 200, body: { ok: true, active } };
}
