/**
 * Portfolio projects stored in D1 (`projects`, migrations/0012_projects.sql).
 * Pure types and validation, shared by the page, the admin editor and the API.
 * An empty table is an empty section: there is no code list of projects.
 * "Remove" sets visible = false. Rows are never deleted.
 */
import { cleanHttpsUrl } from "@/lib/publications";

export type ProjectStatus = "live" | "disabled" | "archive";

export type TeamMember = {
  name: string;
  href?: string;
};

export type ProjectCopyLocale = {
  title: string;
  body: string;
  paragraphs: string[];
  awards: string;
};

export type PortfolioProject = {
  id: string;
  icon: string;
  github: string;
  liveUrl?: string;
  status: ProjectStatus;
  /** Soft-hidden: visitors never see it; edit mode can restore it. */
  visible: boolean;
  /** Optional page extra. "pet" shows the desk pet. "" shows nothing. */
  widget: "" | "pet";
  disabledReason?: { es: string; en: string };
  team: TeamMember[];
  copy: { es: ProjectCopyLocale; en: ProjectCopyLocale };
};

export const PROJECT_MAX = 40;
export const PROJECT_LIMITS = {
  id: 40,
  title: 120,
  body: 600,
  paragraph: 2000,
  paragraphs: 12,
  awards: 300,
  reason: 600,
  icon: 300,
  url: 600,
  team: 12,
  name: 80,
} as const;

const ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const STATUSES: readonly ProjectStatus[] = ["live", "disabled", "archive"];

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

/** Icon is a site path (/projects/...) or an https URL. Empty is allowed. */
export function cleanIconUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return "";
  if (s.length > PROJECT_LIMITS.icon || /\s/.test(s) || CONTROL_RE.test(s)) return null;
  if (s.startsWith("/") && !s.startsWith("//") && !s.includes("..")) return s;
  return cleanHttpsUrl(s);
}

function cleanText(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().replace(/\s+/g, " ");
  if (t.length > max || CONTROL_RE.test(t)) return null;
  return t;
}

/** Multi-line copy (summary and paragraphs). Newlines stay. */
function cleanBlock(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.replace(/\r\n?/g, "\n").trim();
  if (t.length > max || CONTROL_RE.test(t)) return null;
  return t;
}

function cleanParagraphs(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > PROJECT_LIMITS.paragraphs) return null;
  const out: string[] = [];
  for (const p of raw) {
    const t = cleanBlock(p, PROJECT_LIMITS.paragraph);
    if (t === null) return null;
    if (!t) continue;
    out.push(t);
  }
  return out;
}

function cleanTeam(raw: unknown): TeamMember[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > PROJECT_LIMITS.team) return null;
  const out: TeamMember[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const name = cleanText((item as { name?: unknown }).name, PROJECT_LIMITS.name);
    if (!name) return null;
    const hrefRaw = (item as { href?: unknown }).href;
    if (hrefRaw === undefined || hrefRaw === null || hrefRaw === "") {
      out.push({ name });
      continue;
    }
    const href = cleanHttpsUrl(hrefRaw);
    if (!href) return null;
    out.push({ name, href });
  }
  return out;
}

function cleanOptionalHttps(raw: unknown): string | null {
  if (raw === undefined || raw === null) return "";
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return "";
  return cleanHttpsUrl(s);
}

export type ProjectError = { ok: false; error: string; index?: number; field?: string };

export type ProjectValidation =
  | { ok: true; items: PortfolioProject[] }
  | ProjectError;

function localeOf(raw: unknown, field: string, index: number): { ok: true; copy: ProjectCopyLocale } | ProjectError {
  const bad = (error: string, f = field): ProjectError => ({ ok: false, error, index, field: f });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return bad("invalid_value");
  const o = raw as Record<string, unknown>;
  const title = cleanText(o.title, PROJECT_LIMITS.title);
  const body = cleanBlock(o.body ?? "", PROJECT_LIMITS.body);
  const awards = cleanText(o.awards ?? "", PROJECT_LIMITS.awards);
  const paragraphs = cleanParagraphs(o.paragraphs ?? []);
  if (title === null) return bad("invalid_value", "title");
  if (body === null) return bad("invalid_value", "body");
  if (awards === null) return bad("invalid_value", "awards");
  if (!paragraphs) return bad("invalid_value", "paragraphs");
  return { ok: true, copy: { title, body, paragraphs, awards } };
}

/** One project object (the shape the editor and the pages use). */
export function validateProject(raw: unknown, index = 0): { ok: true; item: PortfolioProject } | ProjectError {
  const bad = (error: string, field?: string): ProjectError => ({ ok: false, error, index, ...(field ? { field } : {}) });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return bad("invalid_item");
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !ID_RE.test(o.id)) return bad("invalid_value", "id");
  if (!isProjectStatus(o.status)) return bad("invalid_value", "status");
  if (typeof o.visible !== "boolean") return bad("invalid_value", "visible");
  if (o.widget !== undefined && o.widget !== "" && o.widget !== "pet") return bad("invalid_value", "widget");
  const icon = cleanIconUrl(o.icon ?? "");
  if (icon === null) return bad("invalid_value", "icon");
  const github = cleanOptionalHttps(o.github ?? "");
  if (github === null) return bad("invalid_url", "github");
  const live = cleanOptionalHttps(o.liveUrl ?? "");
  if (live === null) return bad("invalid_url", "liveUrl");
  const copy = o.copy as { es?: unknown; en?: unknown } | undefined;
  const es = localeOf(copy?.es, "title_es", index);
  if (!es.ok) return es;
  const en = localeOf(copy?.en, "title_en", index);
  if (!en.ok) return en;
  if (!es.copy.title && !en.copy.title) return bad("required", "title");
  const team = cleanTeam(o.team ?? []);
  if (!team) return bad("invalid_value", "team");
  const reason = o.disabledReason as { es?: unknown; en?: unknown } | undefined;
  const reasonEs = cleanText(typeof reason?.es === "string" ? reason.es : "", PROJECT_LIMITS.reason);
  const reasonEn = cleanText(typeof reason?.en === "string" ? reason.en : "", PROJECT_LIMITS.reason);
  if (reasonEs === null || reasonEn === null) return bad("invalid_value", "disabledReason");
  return {
    ok: true,
    item: {
      id: o.id,
      icon,
      github,
      liveUrl: live || undefined,
      status: o.status,
      visible: o.visible,
      widget: o.widget === "pet" ? "pet" : "",
      team,
      disabledReason: reasonEs || reasonEn ? { es: reasonEs, en: reasonEn } : undefined,
      copy: { es: es.copy, en: en.copy },
    },
  };
}

/** Whole ordered list. Duplicate ids are rejected. */
export function validateProjectsPayload(body: unknown): ProjectValidation {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_body" };
  const list = (body as { items?: unknown }).items;
  if (!Array.isArray(list)) return { ok: false, error: "invalid_body" };
  if (list.length > PROJECT_MAX) return { ok: false, error: "too_many" };
  const items: PortfolioProject[] = [];
  const ids = new Set<string>();
  for (let index = 0; index < list.length; index++) {
    const v = validateProject(list[index], index);
    if (!v.ok) return v;
    if (ids.has(v.item.id)) return { ok: false, error: "duplicate_id", index, field: "id" };
    ids.add(v.item.id);
    items.push(v.item);
  }
  return { ok: true, items };
}

export function newProjectId(taken: readonly string[], seed = Date.now()): string {
  let n = seed % 1_000_000_000;
  let id = `p-${n.toString(36)}`;
  while (taken.includes(id) || !ID_RE.test(id)) id = `p-${(++n).toString(36)}`;
  return id;
}

export function emptyProject(id: string): PortfolioProject {
  const blank = (): ProjectCopyLocale => ({ title: "", body: "", paragraphs: [], awards: "" });
  return {
    id,
    icon: "",
    github: "",
    status: "disabled",
    visible: true,
    widget: "",
    team: [],
    copy: { es: blank(), en: blank() },
  };
}

/** Title in the page language, falling back to the other language. */
export function projectTitle(p: PortfolioProject, locale: "es" | "en"): string {
  const copy = p.copy[locale];
  return copy.title || p.copy[locale === "en" ? "es" : "en"].title || p.id;
}

export function projectBody(p: PortfolioProject, locale: "es" | "en"): string {
  const copy = p.copy[locale];
  return copy.body || p.copy[locale === "en" ? "es" : "en"].body;
}
