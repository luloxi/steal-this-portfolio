/**
 * Site admin strip: order and visibility of the main sections (landing menu,
 * footer links, sitemap, and whether their pages exist for visitors) and of
 * the projects (/proyectos list, /proyectos/<id>, sitemap).
 * Sections live in D1 site_sections (migration 0008): an empty table means
 * every section visible, in code order. Projects live in D1 `projects`
 * (migration 0012): an empty table means no projects. There is no code list.
 *
 * Pure helpers (no Next/D1 imports): used by proxy.ts, the layout, the
 * sitemap, the admin strip, the API route and tests.
 */
import { sections } from "@/content/site";

export type SectionKey = (typeof sections)[number]["id"];
/** Hideable sections, default order = the landing menu order in src/content/site.ts. */
export const SECTION_KEYS: readonly SectionKey[] = sections.map((s) => s.id);

export type OrderKind = "sections" | "projects";
/** Sections have a fixed catalog. Project ids come from the database. */
export const KIND_KEYS: Readonly<Record<OrderKind, readonly string[]>> = {
  sections: SECTION_KEYS,
  projects: [],
};

const PROJECT_ID = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export type OrderItem<K extends string = string> = { key: K; visible: boolean };
export type SiteSection = OrderItem<SectionKey>;
/** Row shape in D1 (visible is 0/1). Unknown keys are tolerated and ignored. */
export type OrderRow = { key: string; position: number; visible: number | boolean };

export function isSectionKey(key: unknown): key is SectionKey {
  return typeof key === "string" && (SECTION_KEYS as readonly string[]).includes(key);
}

/** Everything visible, in code order: what the site shows with an empty table. */
export function defaultOrder<K extends string>(keys: readonly K[]): OrderItem<K>[] {
  return keys.map((key) => ({ key, visible: true }));
}

/**
 * D1 rows -> full ordered list. Rows sort by position (ties keep the code
 * order); unknown and duplicate keys are dropped; keys missing from the table
 * (e.g. added to the code later) are appended visible, in code order.
 */
export function mergeOrder<K extends string>(keys: readonly K[], rows: readonly OrderRow[] | null | undefined): OrderItem<K>[] {
  const isKey = (k: string): k is K => (keys as readonly string[]).includes(k);
  const known = (rows ?? [])
    .filter((r) => typeof r.key === "string" && isKey(r.key) && Number.isFinite(Number(r.position)))
    .map((r) => ({ key: r.key as K, position: Number(r.position), visible: !(r.visible === 0 || r.visible === false) }))
    .sort((a, b) => a.position - b.position || keys.indexOf(a.key) - keys.indexOf(b.key));
  const out: OrderItem<K>[] = [];
  const seen = new Set<K>();
  for (const r of known) {
    if (seen.has(r.key)) continue;
    seen.add(r.key);
    out.push({ key: r.key, visible: r.visible });
  }
  for (const key of keys) if (!seen.has(key)) out.push({ key, visible: true });
  return out;
}

export const mergeSections = (rows: readonly OrderRow[] | null | undefined) => mergeOrder(SECTION_KEYS, rows);

/**
 * Project rows already are the full list (no code catalog to append).
 * Sorted by position. Unknown duplicates dropped. No rows = no projects.
 */
export function mergeProjects(rows: readonly OrderRow[] | null | undefined): OrderItem[] {
  const known = (rows ?? [])
    .filter((r) => typeof r.key === "string" && PROJECT_ID.test(r.key) && Number.isFinite(Number(r.position)))
    .map((r) => ({ key: r.key, position: Number(r.position), visible: !(r.visible === 0 || r.visible === false) }))
    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
  const out: OrderItem[] = [];
  const seen = new Set<string>();
  for (const r of known) {
    if (seen.has(r.key)) continue;
    seen.add(r.key);
    out.push({ key: r.key, visible: r.visible });
  }
  return out;
}

export type ValidationResult =
  | { ok: true; kind: OrderKind; items: OrderItem[] }
  | { ok: false; error: string };

/**
 * Admin payload: { kind: "sections" | "projects", items: [{ key, visible }, ...] }.
 * Sections: every known section exactly once. Projects: pass `projectIds`
 * (the rows in D1) and the payload must be exactly that set, so a save cannot
 * drop one by accident. Without `projectIds`, any unique project slug is accepted.
 */
export function validateOrderPayload(body: unknown, projectIds?: readonly string[]): ValidationResult {
  const kind = (body as { kind?: unknown } | null)?.kind;
  if (kind !== "sections" && kind !== "projects") return { ok: false, error: "unknown_kind" };
  const list = (body as { items?: unknown }).items;
  if (!Array.isArray(list)) return { ok: false, error: "items_required" };
  const allowed = kind === "sections" ? new Set<string>(SECTION_KEYS) : projectIds ? new Set(projectIds) : null;
  if (allowed && list.length !== allowed.size) return { ok: false, error: "wrong_length" };
  const seen = new Set<string>();
  const out: OrderItem[] = [];
  for (const item of list) {
    const key = (item as { key?: unknown } | null)?.key;
    const visible = (item as { visible?: unknown } | null)?.visible;
    if (typeof key !== "string" || (kind === "projects" ? !PROJECT_ID.test(key) : !allowed?.has(key))) {
      return { ok: false, error: "unknown_key" };
    }
    if (allowed && !allowed.has(key)) return { ok: false, error: "unknown_key" };
    if (seen.has(key)) return { ok: false, error: "duplicate_key" };
    if (typeof visible !== "boolean") return { ok: false, error: "invalid_visible" };
    seen.add(key);
    out.push({ key, visible });
  }
  return { ok: true, kind, items: out };
}

export function hiddenSet<K extends string>(list: readonly OrderItem<K>[]): Set<K> {
  return new Set(list.filter((s) => !s.visible).map((s) => s.key));
}

/** Move one item (drag and the ← → buttons). Out-of-range moves return a copy unchanged. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const out = [...list];
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}

/** Apply an ordered visibility list to records with an id (hidden ones dropped unless showHidden). */
export function orderRecords<T extends { id: string }>(records: readonly T[], order: readonly OrderItem[], showHidden = false): T[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  const out: T[] = [];
  for (const o of order) {
    const r = byId.get(o.key);
    if (r && (o.visible || showHidden)) out.push(r);
  }
  // Records the order doesn't know keep their place at the end.
  for (const r of records) if (!order.some((o) => o.key === r.id)) out.push(r);
  return out;
}

/** Spanish first path segment -> section. /tastes redirects into Sobre mí, so it follows it. */
const SEGMENT_SECTION: Readonly<Record<string, SectionKey>> = {
  contratar: "hire",
  blog: "blog",
  "sobre-mi": "about",
  tastes: "about",
  proyectos: "projects",
  contacto: "contact",
  referidos: "referrals",
};

/**
 * Section an internal (Spanish) path belongs to, subpages included
 * (/blog/<slug>, /proyectos/<id>). Home, /privacidad, /ingresar: null (always on).
 */
export function sectionForPath(esPath: string): SectionKey | null {
  const first = (esPath.split(/[?#]/)[0] ?? "").split("/").filter(Boolean)[0];
  return first ? (SEGMENT_SECTION[first] ?? null) : null;
}

/** Project id of /proyectos/<id> (Spanish internal path), else null. */
export function projectForPath(esPath: string): string | null {
  const m = (esPath.split(/[?#]/)[0] ?? "").match(/^\/proyectos\/([^/]+)\/?$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/** True when the page at this Spanish path is out of the public site (hidden section or hidden project). */
export function isPathHidden(esPath: string, sectionsList: readonly SiteSection[], projectsList: readonly OrderItem[] = []): boolean {
  const key = sectionForPath(esPath);
  if (key && hiddenSet(sectionsList).has(key)) return true;
  const id = projectForPath(esPath);
  return id ? hiddenSet(projectsList).has(id) : false;
}

/** Items a public list renders: visible ones, plus hidden ones (flagged) while the admin edits. */
export function visibleItems<K extends string>(list: readonly OrderItem<K>[], showHidden: boolean): OrderItem<K>[] {
  return showHidden ? [...list] : list.filter((s) => s.visible);
}

/** Case/accent-insensitive "contains" for the strip's search box. */
export function matchesQuery(label: string, query: string): boolean {
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const q = norm(query);
  return !q || norm(label).includes(q);
}
