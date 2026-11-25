/**
 * Cookieless first-party visit counter. The Worker records a row for each real
 * page GET (not assets, APIs, prefetch or obvious bots). Stored fields: time,
 * path, utm_*, referrer host, country. Never an IP, cookie or user agent.
 */
import type { D1Database } from "@/lib/db";

export const VISIT_SITE_ORIGIN = "https://lulox.com.ar";
export const HIRE_PATHS = ["/contratar", "/en/hire", "/contacto", "/en/contact"] as const;
export const TEST_UTM_SOURCE = "test";
export const TEST_UTM_CAMPAIGN = "analytics-smoke";

const SAME_HOSTS = new Set(["lulox.com.ar", "www.lulox.com.ar", "lulox.dev", "www.lulox.dev", "localhost"]);
const SKIP_PREFIXES = ["/api/", "/_next/", "/media/", "/icons/", "/audio/", "/orgs/", "/projects/", "/admin/", "/.well-known/"];
const SKIP_PATHS = new Set(["/api", "/robots.txt", "/sitemap.xml", "/llms.txt", "/manifest.json", "/manifest.v5.webmanifest", "/ingresar", "/en/sign-in", "/favicon.ico"]);
const BOT_UA = /(?:bot|crawl|spider|slurp|facebookexternalhit|preview\/|whatsapp|telegram|discord|embedly|quora|pinterest|redditbot|linkedinbot|twitterbot|applebot|bingpreview|yandex|baidu|duckduck|semrush|ahrefs|petalbot|gptbot|claudebot|bytespider)/i;
const UTM_RE = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const PATH_MAX = 200;
const DAY_TZ = "America/Argentina/Buenos_Aires";

export type VisitEnv = { DB?: D1Database };

export type PageVisit = {
  visitedAt: string;
  day: string;
  path: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrerHost: string | null;
  country: string | null;
  source: string;
};

export type CountRow = { key: string; visits: number };

export type VisitStats = {
  total: number;
  hireTotal: number;
  byDay: CountRow[];
  bySource: CountRow[];
  hireByDay: CountRow[];
  hireBySource: CountRow[];
};

export const UTM_CHANNELS = [
  { source: "instagram", medium: "social" },
  { source: "linkedin", medium: "social" },
  { source: "x", medium: "social" },
  { source: "email", medium: "email" },
] as const;

export const UTM_LANDINGS = [
  { path: "/", campaign: "portfolio", labelEs: "Inicio", labelEn: "Home" },
  { path: "/contacto", campaign: "implementacion-ia", labelEs: "Implementación de IA", labelEn: "AI implementation" },
] as const;

export type UtmLink = {
  source: string;
  medium: string;
  campaign: string;
  path: string;
  labelEs: string;
  url: string;
};

/** Ready-to-paste campaign links for Instagram, LinkedIn, X and email. */
export function utmLinks(origin = VISIT_SITE_ORIGIN): UtmLink[] {
  const links: UtmLink[] = [];
  for (const landing of UTM_LANDINGS) {
    for (const ch of UTM_CHANNELS) {
      const url = new URL(landing.path, origin);
      url.searchParams.set("utm_source", ch.source);
      url.searchParams.set("utm_medium", ch.medium);
      url.searchParams.set("utm_campaign", landing.campaign);
      links.push({
        source: ch.source,
        medium: ch.medium,
        campaign: landing.campaign,
        path: landing.path,
        labelEs: `${landing.labelEs} · ${ch.source}`,
        url: url.toString(),
      });
    }
  }
  return links;
}

export function dayInArgentina(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

function cleanUtm(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (!UTM_RE.test(v)) return null;
  return v;
}

function cleanPath(pathname: string): string | null {
  let path = pathname || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path.length > PATH_MAX) return null;
  if (!path.startsWith("/")) return null;
  if (path.includes("..") || path.includes("\\") || path.includes("\0")) return null;
  return path;
}

function referrerHostOf(request: Request, pageHost: string): string | null {
  const raw = request.headers.get("referer") || request.headers.get("referrer");
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (!host) return null;
    if (host === pageHost.toLowerCase() || SAME_HOSTS.has(host)) return null;
    if (host.length > 80) return null;
    return host;
  } catch {
    return null;
  }
}

function countryOf(request: Request): string | null {
  const raw = (request.headers.get("cf-ipcountry") ?? "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(raw) || raw === "T1" || raw === "XX") return raw;
  return null;
}

function sourceOf(utmSource: string | null, referrerHost: string | null): string {
  if (utmSource) return `utm:${utmSource}`;
  if (referrerHost) return `ref:${referrerHost}`;
  return "direct";
}

function isPrefetch(request: Request): boolean {
  const purpose = `${request.headers.get("purpose") ?? ""} ${request.headers.get("sec-purpose") ?? ""}`.toLowerCase();
  if (purpose.includes("prefetch") || purpose.includes("prerender")) return true;
  if (request.headers.get("next-router-prefetch") === "1") return true;
  if (request.headers.has("rsc")) return true;
  return false;
}

function isDocumentGet(request: Request): boolean {
  if (request.method !== "GET") return false;
  const dest = (request.headers.get("sec-fetch-dest") ?? "").toLowerCase();
  if (dest && dest !== "document") return false;
  const accept = request.headers.get("accept") ?? "";
  if (accept && !accept.includes("text/html") && !accept.includes("*/*")) return false;
  return true;
}

function isSkippedPath(path: string): boolean {
  if (SKIP_PATHS.has(path)) return true;
  if (SKIP_PREFIXES.some((p) => path.startsWith(p) || path + "/" === p)) return true;
  if (path === "/admin") return true;
  if (/\.[a-z0-9]{1,8}$/i.test(path) && !path.endsWith(".html")) return true;
  return false;
}

export function shouldRecordPageVisit(request: Request, url: URL = new URL(request.url)): boolean {
  if (!isDocumentGet(request) || isPrefetch(request)) return false;
  const path = cleanPath(url.pathname);
  if (!path || isSkippedPath(path)) return false;
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return false;
  return true;
}

export function visitFromRequest(request: Request, url: URL = new URL(request.url), at: Date = new Date()): PageVisit | null {
  if (!shouldRecordPageVisit(request, url)) return null;
  const path = cleanPath(url.pathname);
  if (!path) return null;
  const utmSource = cleanUtm(url.searchParams.get("utm_source"));
  const utmMedium = cleanUtm(url.searchParams.get("utm_medium"));
  const utmCampaign = cleanUtm(url.searchParams.get("utm_campaign"));
  const referrerHost = referrerHostOf(request, url.hostname);
  return {
    visitedAt: at.toISOString(),
    day: dayInArgentina(at),
    path,
    utmSource,
    utmMedium,
    utmCampaign,
    referrerHost,
    country: countryOf(request),
    source: sourceOf(utmSource, referrerHost),
  };
}

export async function recordPageVisit(env: VisitEnv, request: Request, url?: URL): Promise<void> {
  try {
    const db = env.DB;
    if (!db) return;
    const visit = visitFromRequest(request, url ?? new URL(request.url));
    if (!visit) return;
    await insertVisit(db, visit);
  } catch (err) {
    console.error("[page-visits]", err);
  }
}

export async function insertVisit(db: D1Database, visit: PageVisit): Promise<void> {
  await db
    .prepare(
      `INSERT INTO page_visits (visited_at, day, path, utm_source, utm_medium, utm_campaign, referrer_host, country, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      visit.visitedAt,
      visit.day,
      visit.path,
      visit.utmSource,
      visit.utmMedium,
      visit.utmCampaign,
      visit.referrerHost,
      visit.country,
      visit.source,
    )
    .run();
}

const HIRE_LIST = HIRE_PATHS.map((p) => `'${p}'`).join(", ");

export async function loadVisitStats(db: D1Database, days = 60): Promise<VisitStats> {
  const since = dayInArgentina(new Date(Date.now() - days * 86400000));
  const count = async (sql: string, ...bind: unknown[]) => {
    const row = await db.prepare(sql).bind(...bind).first<{ n: number }>();
    return Number(row?.n ?? 0);
  };
  const rows = async (sql: string, ...bind: unknown[]) => {
    const res = await db.prepare(sql).bind(...bind).all<{ key: string; visits: number }>();
    return (res.results ?? []).map((r) => ({ key: String(r.key), visits: Number(r.visits) }));
  };
  const [total, hireTotal, byDay, bySource, hireByDay, hireBySource] = await Promise.all([
    count(`SELECT COUNT(*) AS n FROM page_visits WHERE day >= ?`, since),
    count(`SELECT COUNT(*) AS n FROM page_visits WHERE day >= ? AND path IN (${HIRE_LIST})`, since),
    rows(`SELECT day AS key, COUNT(*) AS visits FROM page_visits WHERE day >= ? GROUP BY day ORDER BY day DESC`, since),
    rows(`SELECT source AS key, COUNT(*) AS visits FROM page_visits WHERE day >= ? GROUP BY source ORDER BY visits DESC, source ASC`, since),
    rows(`SELECT day AS key, COUNT(*) AS visits FROM page_visits WHERE day >= ? AND path IN (${HIRE_LIST}) GROUP BY day ORDER BY day DESC`, since),
    rows(`SELECT source AS key, COUNT(*) AS visits FROM page_visits WHERE day >= ? AND path IN (${HIRE_LIST}) GROUP BY source ORDER BY visits DESC, source ASC`, since),
  ]);
  return { total, hireTotal, byDay, bySource, hireByDay, hireBySource };
}

/** Deletes only rows tagged as the automated smoke test. */
export async function deleteSmokeTestVisits(db: D1Database): Promise<number> {
  const before = await db
    .prepare(`SELECT COUNT(*) AS n FROM page_visits WHERE utm_source = ? AND utm_campaign = ?`)
    .bind(TEST_UTM_SOURCE, TEST_UTM_CAMPAIGN)
    .first<{ n: number }>();
  await db
    .prepare(`DELETE FROM page_visits WHERE utm_source = ? AND utm_campaign = ?`)
    .bind(TEST_UTM_SOURCE, TEST_UTM_CAMPAIGN)
    .run();
  return Number(before?.n ?? 0);
}

const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

export function webAnalyticsSnippet(token: string | undefined | null): string | null {
  const t = token?.trim();
  if (!t || !/^[a-zA-Z0-9_-]{8,80}$/.test(t)) return null;
  const payload = JSON.stringify({ token: t }).replace(/</g, "\\u003c");
  return `<script defer src="${BEACON_SRC}" data-cf-beacon='${payload}'></script>`;
}
