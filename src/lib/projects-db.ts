/**
 * D1 side of portfolio projects (migrations/0012_projects.sql).
 * Reads never throw: no binding or a missing table means an empty list.
 * Writes are INSERT ... ON CONFLICT DO UPDATE and UPDATE only.
 * A project left out of a full save is hidden (visible = 0), never deleted.
 */
import { cache } from "react";
import { getDb, nowIso, type D1Database } from "@/lib/db";
import {
  validateProject,
  type PortfolioProject,
  type ProjectStatus,
  type TeamMember,
} from "@/lib/projects";

export type ProjectRow = {
  id: unknown;
  position?: unknown;
  visible?: unknown;
  status?: unknown;
  icon_url?: unknown;
  github_url?: unknown;
  live_url?: unknown;
  title_es?: unknown;
  title_en?: unknown;
  description_es?: unknown;
  description_en?: unknown;
  paragraphs_es?: unknown;
  paragraphs_en?: unknown;
  awards_es?: unknown;
  awards_en?: unknown;
  disabled_reason_es?: unknown;
  disabled_reason_en?: unknown;
  team_json?: unknown;
  widget?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseJsonArray(raw: unknown): unknown[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Stored row to a project, or null when the row is not usable. */
export function projectFromRow(row: ProjectRow): PortfolioProject | null {
  const team = parseJsonArray(row.team_json).map((item) => {
    if (!item || typeof item !== "object") return null;
    const name = asString((item as { name?: unknown }).name).trim();
    if (!name) return null;
    const href = asString((item as { href?: unknown }).href).trim();
    return href ? { name, href } : { name };
  }).filter(Boolean) as TeamMember[];
  const v = validateProject({
    id: row.id,
    icon: asString(row.icon_url),
    github: asString(row.github_url),
    liveUrl: asString(row.live_url),
    status: asString(row.status) || "disabled",
    visible: !(row.visible === 0 || row.visible === false),
    widget: row.widget === "pet" ? "pet" : "",
    team,
    disabledReason: {
      es: asString(row.disabled_reason_es),
      en: asString(row.disabled_reason_en),
    },
    copy: {
      es: {
        title: asString(row.title_es),
        body: asString(row.description_es),
        paragraphs: parseJsonArray(row.paragraphs_es).map((p) => String(p)),
        awards: asString(row.awards_es),
      },
      en: {
        title: asString(row.title_en),
        body: asString(row.description_en),
        paragraphs: parseJsonArray(row.paragraphs_en).map((p) => String(p)),
        awards: asString(row.awards_en),
      },
    },
  });
  return v.ok ? v.item : null;
}

const SELECT =
  `SELECT id, position, visible, status, icon_url, github_url, live_url,
          title_es, title_en, description_es, description_en,
          paragraphs_es, paragraphs_en, awards_es, awards_en,
          disabled_reason_es, disabled_reason_en, team_json, widget
   FROM projects ORDER BY position, created_at, id`;

export async function loadProjects(db: D1Database | null): Promise<PortfolioProject[]> {
  if (!db) return [];
  try {
    const { results } = await db.prepare(SELECT).all<ProjectRow>();
    const out: PortfolioProject[] = [];
    for (const row of results ?? []) {
      const p = projectFromRow(row);
      if (p && !out.some((x) => x.id === p.id)) out.push(p);
    }
    return out;
  } catch (err) {
    console.error("[projects] empty list (no table or bad rows):", err);
    return [];
  }
}

export const getProjects = cache(async () => loadProjects(await getDb()));

export async function getProject(id: string): Promise<PortfolioProject | null> {
  const all = await getProjects();
  return all.find((p) => p.id === id) ?? null;
}

function bindProject(db: D1Database, p: PortfolioProject, position: number, now: string) {
  return db
    .prepare(
      `INSERT INTO projects (
         id, position, visible, status, icon_url, github_url, live_url,
         title_es, title_en, description_es, description_en,
         paragraphs_es, paragraphs_en, awards_es, awards_en,
         disabled_reason_es, disabled_reason_en, team_json, widget,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         position = excluded.position,
         visible = excluded.visible,
         status = excluded.status,
         icon_url = excluded.icon_url,
         github_url = excluded.github_url,
         live_url = excluded.live_url,
         title_es = excluded.title_es,
         title_en = excluded.title_en,
         description_es = excluded.description_es,
         description_en = excluded.description_en,
         paragraphs_es = excluded.paragraphs_es,
         paragraphs_en = excluded.paragraphs_en,
         awards_es = excluded.awards_es,
         awards_en = excluded.awards_en,
         disabled_reason_es = excluded.disabled_reason_es,
         disabled_reason_en = excluded.disabled_reason_en,
         team_json = excluded.team_json,
         widget = excluded.widget,
         updated_at = excluded.updated_at`,
    )
    .bind(
      p.id,
      position,
      p.visible ? 1 : 0,
      p.status satisfies ProjectStatus,
      p.icon,
      p.github,
      p.liveUrl ?? "",
      p.copy.es.title,
      p.copy.en.title,
      p.copy.es.body,
      p.copy.en.body,
      JSON.stringify(p.copy.es.paragraphs),
      JSON.stringify(p.copy.en.paragraphs),
      p.copy.es.awards,
      p.copy.en.awards,
      p.disabledReason?.es ?? "",
      p.disabledReason?.en ?? "",
      JSON.stringify(p.team),
      p.widget,
      now,
      now,
    );
}

/** Save the whole ordered list. Missing rows are hidden, not deleted. */
export async function saveProjects(db: D1Database, items: readonly PortfolioProject[]): Promise<void> {
  const now = nowIso();
  const stmts = items.map((p, position) => bindProject(db, p, position, now));
  const ids = items.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(", ");
  stmts.push(
    db
      .prepare(
        `UPDATE projects SET visible = 0, position = position + ?, updated_at = ? WHERE visible = 1${ids.length ? ` AND id NOT IN (${placeholders})` : ""}`,
      )
      .bind(items.length, now, ...ids),
  );
  await db.batch(stmts);
}

/** Update one project. Keeps its position when it already exists. Does not hide others. */
export async function saveProject(db: D1Database, item: PortfolioProject): Promise<void> {
  const now = nowIso();
  const row = await db.prepare("SELECT position FROM projects WHERE id = ? LIMIT 1").bind(item.id).first<{ position: number }>();
  let position = row?.position;
  if (position === undefined || position === null || Number.isNaN(Number(position))) {
    const max = await db.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM projects").first<{ m: number }>();
    position = Number(max?.m ?? -1) + 1;
  }
  await bindProject(db, item, Number(position), now).run();
}

export async function listProjectIds(db: D1Database | null): Promise<string[]> {
  if (!db) return [];
  try {
    const { results } = await db.prepare("SELECT id FROM projects ORDER BY position, id").all<{ id: string }>();
    return (results ?? []).map((r) => r.id).filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}
