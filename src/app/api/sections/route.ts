import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/blog";
import { getDb } from "@/lib/db";
import { listProjectIds } from "@/lib/projects-db";
import { validateOrderPayload } from "@/lib/site-sections";
import { getSiteOrder, saveOrder } from "@/lib/site-order";

export const dynamic = "force-dynamic";

/** Admin only: current order and visibility of sections and projects. */
export async function GET() {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 401 });
  return NextResponse.json(await getSiteOrder());
}

/**
 * Admin only: save the full order + visibility of one kind.
 * Body: { kind: "sections" | "projects", items: [{ key, visible }, ...] }.
 */
export async function PUT(request: Request) {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const kind = (body as { kind?: unknown } | null)?.kind;
  const projectIds = kind === "projects" ? await listProjectIds(await getDb()) : undefined;
  const v = validateOrderPayload(body, projectIds);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    await saveOrder(v.kind, v.items);
  } catch (err) {
    console.error("[api/sections] save", err);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, kind: v.kind, items: v.items });
}
