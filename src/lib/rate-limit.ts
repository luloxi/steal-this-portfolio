/**
 * Per-IP burst limit for the Worker (Workers Rate Limiting bindings, free plan).
 * worker.ts calls rateLimited() before Next runs, so a flood costs one local counter
 * and a tiny 429, not a page render or a D1 read.
 *
 * Counters are per Cloudflare location and approximate. Exemption (owner and accounts marked
 * "sin límite" in Personalizar) is only looked up AFTER a limit is hit, so normal browsing
 * never pays for it.
 */
import { isAdminUser } from "./auth/admin";
import { PRIVILEGED_KEY, isPrivileged } from "./privileged";

export type RL = { limit(options: { key: string }): Promise<{ success: boolean }> };
export type RateEnv = {
  /** 100 requests / 10 s per IP for pages and anything that is not /api. */
  SITE_RL?: RL;
  /** 40 requests / 10 s per IP for /api/*. */
  API_RL?: RL;
  /** 5 session look-ups / 10 s per IP, so fake cookies cannot become database reads. */
  EXEMPT_RL?: RL;
  DB?: { prepare(sql: string): { bind(...v: unknown[]): { first<T>(): Promise<T | null> } } };
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

async function pass(rl: RL | undefined, key: string): Promise<boolean> {
  if (!rl) return true;
  try {
    return (await rl.limit({ key })).success;
  } catch {
    return true;
  }
}

async function exempt(request: Request, env: RateEnv, ip: string): Promise<boolean> {
  if (!env.DB || !env.BETTER_AUTH_SECRET) return false;
  if (!/better-auth\.session_token=/.test(request.headers.get("cookie") ?? "")) return false;
  if (!(await pass(env.EXEMPT_RL, `x:${ip}`))) return false;
  try {
    const [{ betterAuth }, { buildAuthOptions }] = await Promise.all([import("better-auth"), import("./auth/options")]);
    const auth = betterAuth(buildAuthOptions(env.DB as never, env));
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;
    if (!user?.email) return false;
    if (isAdminUser(user)) return true;
    const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key = ?").bind(PRIVILEGED_KEY).first<{ value: string }>();
    return isPrivileged(user.email, row?.value);
  } catch {
    return false;
  }
}

/** A 429 to send, or null to let the request through. */
export async function rateLimited(request: Request, pathname: string, env: RateEnv): Promise<Response | null> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const api = isApiPath(pathname);
  if (await pass(api ? env.API_RL : env.SITE_RL, `${api ? "a" : "p"}:${ip}`)) return null;
  if (await exempt(request, env, ip)) return null;
  return new Response("Too many requests", {
    status: 429,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "retry-after": "10" },
  });
}
