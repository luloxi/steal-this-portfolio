import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";
import { getDb, requireDb } from "@/lib/db";
import { PRIVILEGED_KEY, formatPrivileged, parsePrivileged } from "@/lib/privileged";
import { saveSiteSettings } from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function gate() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  if (!viewer.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  return null;
}

/** Admin only: the emails that are never cut off by the request rate limit. */
export async function GET() {
  const denied = await gate();
  if (denied) return denied;
  const db = await getDb();
  let value = "";
  try {
    const row = db ? await db.prepare("SELECT value FROM site_settings WHERE key = ?").bind(PRIVILEGED_KEY).first<{ value: string }>() : null;
    value = row?.value ?? "";
  } catch {
    value = "";
  }
  return NextResponse.json({ emails: parsePrivileged(value) }, { headers: NO_STORE });
}

/** Admin only: { emails: string } (one per line, or separated by commas or spaces). */
export async function PUT(request: Request) {
  const denied = await gate();
  if (denied) return denied;
  let body: { emails?: unknown } | null = null;
  try {
    body = (await request.json()) as { emails?: unknown };
  } catch {
    body = null;
  }
  if (!body || typeof body.emails !== "string" || body.emails.length > 5000) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400, headers: NO_STORE });
  }
  const emails = parsePrivileged(body.emails);
  try {
    await saveSiteSettings(await requireDb(), [{ key: PRIVILEGED_KEY, value: formatPrivileged(emails) }]);
  } catch {
    return NextResponse.json({ error: "save_failed" }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true, emails }, { headers: NO_STORE });
}
