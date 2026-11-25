import { checkCode } from "@/lib/referrals-api";
import { getDb, ipOf, json, limiter, refEnv, unavailable } from "@/lib/referrals-route";

export const dynamic = "force-dynamic";

/**
 * GET ?code=xyz -> { status: "available" | "taken" | "invalid" | "reserved", active? }.
 * Used by the signup form (availability) and the contact form (is the code active?).
 * Rate limited per IP with REF_CHECK_RL (60/min).
 */
export async function GET(request: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const env = await refEnv();
  if (!(await limiter(env.REF_CHECK_RL, `refcheck:${ipOf(request)}`)())) return json({ status: 429, body: { error: "rate_limited" } });
  return json(await checkCode(new URL(request.url).searchParams.get("code"), db));
}
