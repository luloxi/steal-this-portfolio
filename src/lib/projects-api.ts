/**
 * Save API for portfolio projects (PUT /api/projects).
 * 401: no session. 403: not admin, or edit mode off.
 * Body is either { items: Project[] } (whole list) or one project object.
 */
import { validateProject, validateProjectsPayload, type PortfolioProject } from "@/lib/projects";

export type ProjectCaller = { signedIn: boolean; isAdmin: boolean; editOn: boolean };
export type ProjectResult = { status: number; body: Record<string, unknown> };

export function projectsGate(c: ProjectCaller): ProjectResult | null {
  if (!c.signedIn) return { status: 401, body: { error: "unauthorized" } };
  if (!c.isAdmin) return { status: 403, body: { error: "forbidden" } };
  if (!c.editOn) return { status: 403, body: { error: "edit_mode_off" } };
  return null;
}

export async function handleProjectsSave(
  caller: ProjectCaller,
  body: unknown,
  saveAll: (items: PortfolioProject[]) => Promise<void>,
  saveOne: (item: PortfolioProject) => Promise<void>,
): Promise<ProjectResult> {
  const denied = projectsGate(caller);
  if (denied) return denied;
  if (!body || typeof body !== "object") return { status: 400, body: { error: "invalid_body" } };
  try {
    if (Array.isArray((body as { items?: unknown }).items)) {
      const v = validateProjectsPayload(body);
      if (!v.ok) {
        const { ok: _ok, ...err } = v;
        return { status: 400, body: err };
      }
      await saveAll(v.items);
      return { status: 200, body: { ok: true, projects: v.items } };
    }
    const v = validateProject(body);
    if (!v.ok) {
      const { ok: _ok, ...err } = v;
      return { status: 400, body: err };
    }
    await saveOne(v.item);
    return { status: 200, body: { ok: true, project: v.item } };
  } catch {
    console.error("[api/projects] save failed");
    return { status: 500, body: { error: "save_failed" } };
  }
}
