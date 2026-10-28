import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isAdminUser } from "@/lib/auth/admin";
import { editModeFromCookie } from "@/lib/edit-mode";
import { requireDb } from "@/lib/db";
import { handleProjectsSave, type ProjectCaller } from "@/lib/projects-api";
import { getProjects, saveProject, saveProjects } from "@/lib/projects-db";
import { requireAdminSession } from "@/lib/blog";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function caller(): Promise<ProjectCaller> {
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

/** Admin only: every project, including hidden ones (the editor needs them). */
export async function GET() {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 401 });
  return NextResponse.json({ projects: await getProjects() }, { headers: NO_STORE });
}

/** Admin + edit mode: save one project, or the whole ordered list ({ items }). */
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
  const r = await handleProjectsSave(
    who,
    body,
    async (items) => saveProjects(await requireDb(), items),
    async (item) => saveProject(await requireDb(), item),
  );
  return NextResponse.json(r.body, { status: r.status, headers: NO_STORE });
}
