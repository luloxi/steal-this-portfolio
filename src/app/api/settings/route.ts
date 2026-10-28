import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isAdminUser } from "@/lib/auth/admin";
import { editModeFromCookie } from "@/lib/edit-mode";
import { requireDb } from "@/lib/db";
import { handleSettingsSave, type SettingsCaller } from "@/lib/site-settings-api";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function caller(): Promise<SettingsCaller> {
  const h = await headers();
  const editOn = editModeFromCookie(h.get("cookie"));
  try {
    const { getAuth } = await import("@/lib/auth/server");
    const auth = await getAuth();
    if (!auth) return { signedIn: false, isAdmin: false, editOn };
    const session = await auth.api.getSession({ headers: h });
    const user = session?.user;
    return { signedIn: Boolean(user), isAdmin: isAdminUser(user), editOn };
  } catch {
    return { signedIn: false, isAdmin: false, editOn };
  }
}

/** Admin only: current identity (defaults filled in where D1 has no row). */
export async function GET() {
  const who = await caller();
  if (!who.signedIn) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  if (!who.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  return NextResponse.json({ settings: await getSiteSettings() }, { headers: NO_STORE });
}

/** Admin + edit mode: { values: { name, color.dark.accent, ... } }. */
export async function PUT(request: Request) {
  const who = await caller();
  let body: unknown = null;
  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      body = null;
    }
  }
  const r = await handleSettingsSave(who, body, async (entries) => saveSiteSettings(await requireDb(), entries));
  return NextResponse.json(r.body, { status: r.status, headers: NO_STORE });
}
