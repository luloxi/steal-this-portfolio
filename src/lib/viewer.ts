import { cache } from "react";
import { headers } from "next/headers";
import type { Viewer } from "@/lib/referrals-api";

/**
 * Who is asking, decided on the server from the Better Auth session cookie:
 * null (anonymous), a signed-in Google user, or the admin (ADMIN_EMAILS
 * allowlist, same rule as requireAdminSession). Any failure = anonymous.
 * Cached per request: layout, pages and metadata share one session read.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  try {
    const h = await headers();
    if (!/better-auth\.session_token=/.test(h.get("cookie") ?? "")) return null;
    const { getAuth } = await import("@/lib/auth/server");
    const { isAdminUser } = await import("@/lib/auth/admin");
    const auth = await getAuth();
    if (!auth) return null;
    const session = await auth.api.getSession({ headers: h });
    const u = session?.user;
    if (!u?.id || !u.email) return null;
    return { id: u.id, email: u.email, name: u.name ?? "", isAdmin: isAdminUser(u), image: typeof u.image === "string" && /^https:\/\//.test(u.image) ? u.image : undefined };
  } catch {
    return null;
  }
});
