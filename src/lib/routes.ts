/**
 * Bilingual URLs. Spanish lives at the root (canonical, x-default) and English
 * under /en with translated segments. The URL alone decides the language of the
 * page body and of the share metadata; the lulox-locale cookie only remembers
 * what the language selector picked last.
 *
 * Pure helpers (no Next imports): used by proxy.ts, metadata, links and tests.
 */
import type { Locale } from "@/i18n/types";

/** Request header set by proxy.ts on every page request (never trusted from the client). */
export const LOCALE_HEADER = "x-lulox-locale";
export const EN_PREFIX = "/en";

/** Spanish first segment -> English first segment. Order matters only for readability. */
export const SEGMENTS_ES_TO_EN: Readonly<Record<string, string>> = {
  contratar: "hire",
  blog: "blog",
  "sobre-mi": "about",
  proyectos: "projects",
  contacto: "contact",
  privacidad: "privacy",
  ingresar: "sign-in",
  referidos: "referrals",
};

const SEGMENTS_EN_TO_ES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SEGMENTS_ES_TO_EN).map(([es, en]) => [en, es]),
);

/** Language of a public URL path: /en and /en/... are English, everything else Spanish. */
export function localeFromPath(pathname: string | null | undefined): Locale {
  if (!pathname) return "es";
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) ? "en" : "es";
}

function splitPath(p: string) {
  const clean = p.split(/[?#]/)[0] ?? "";
  return clean.split("/").filter(Boolean);
}

/**
 * Spanish path -> English path. Keeps the rest of the path as is (project ids,
 * blog slugs: pass the English slug yourself, see blogPostPath).
 * Unknown first segments return null (no English twin).
 */
export function esToEnPath(esPath: string): string | null {
  const parts = splitPath(esPath);
  if (!parts.length) return EN_PREFIX;
  const en = SEGMENTS_ES_TO_EN[parts[0]];
  if (!en) return null;
  return [EN_PREFIX, en, ...parts.slice(1)].join("/");
}

/** English path (/en/...) -> internal Spanish path. null when it isn't an /en path or the segment is unknown. */
export function enToEsPath(enPath: string): string | null {
  const parts = splitPath(enPath);
  if (parts[0] !== EN_PREFIX.slice(1)) return null;
  if (parts.length === 1) return "/";
  const es = SEGMENTS_EN_TO_ES[parts[1]];
  if (!es) return null;
  return "/" + [es, ...parts.slice(2)].join("/");
}

/**
 * Link helper: components keep writing Spanish paths ("/contratar") and this
 * returns the URL in the given language. Non-site hrefs (http, mailto, #) and
 * paths already under /en pass through untouched.
 */
export function localizePath(locale: Locale, esPath: string): string {
  if (locale === "es" || !esPath.startsWith("/") || esPath.startsWith("//")) return esPath;
  if (localeFromPath(esPath) === "en") return esPath;
  const m = esPath.match(/^([^?#]*)(.*)$/);
  const en = esToEnPath(m?.[1] ?? esPath);
  return en ? en + (m?.[2] ?? "") : esPath;
}

/** Public URL of a post in a language. Posts without slug_en use the Spanish slug under /en. */
export function blogPostPath(locale: Locale, post: { slug: string; slugEn?: string | null }): string {
  return locale === "en"
    ? `${EN_PREFIX}/blog/${encodeURIComponent(post.slugEn || post.slug)}`
    : `/blog/${encodeURIComponent(post.slug)}`;
}

/** Both language versions of the page at a Spanish path (for hreflang, sitemap, the selector). */
export function pathPair(esPath: string, enPath?: string): Record<Locale, string> {
  return { es: esPath, en: enPath ?? esToEnPath(esPath) ?? EN_PREFIX };
}

/** Same page in the other language, from the current URL alone (blog slugs are fixed up by proxy 301s). */
export function switchLocalePath(pathname: string, to: Locale): string {
  const from = localeFromPath(pathname);
  if (from === to) return pathname;
  if (to === "en") return esToEnPath(pathname) ?? EN_PREFIX;
  return enToEsPath(pathname) ?? "/";
}

/* ---------- slugs ---------- */

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX = 120;

/** Create-post URL segment. Not a real article slug (reserved so /blog/nuevo never 404s as a missing post). */
export const NEW_POST_SLUG = "nuevo";

function pathOnly(pathname: string): string {
  const clean = (pathname.split(/[?#]/)[0] ?? "") || "/";
  return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

/** /blog/nuevo and /en/blog/nuevo (trailing slash ignored). */
export function isNewPostPath(pathname: string): boolean {
  const p = pathOnly(pathname);
  return p === `/blog/${NEW_POST_SLUG}` || p === `${EN_PREFIX}/blog/${NEW_POST_SLUG}`;
}

/** /ingresar and /en/sign-in (trailing slash ignored). */
export function isSignInPath(pathname: string): boolean {
  const p = pathOnly(pathname);
  return p === "/ingresar" || p === `${EN_PREFIX}/sign-in`;
}

export function isReservedBlogSlug(slug: string): boolean {
  return slug === NEW_POST_SLUG;
}

/**
 * Title -> kebab-case slug: lowercase, accents/diacritics stripped (NFD),
 * apostrophes dropped ("I'm" -> "im"), anything else non-alphanumeric -> "-",
 * repeated/edge hyphens removed. Same rules as the SQL backfill in
 * migrations/0007_blog_slug_en.sql.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(s: string): boolean {
  return s.length > 0 && s.length <= SLUG_MAX && SLUG_RE.test(s);
}

/** First free slug: base, base-2, base-3... (taken = slugs already in use). */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let i = 2; ; i++) {
    const s = `${base}-${i}`;
    if (!used.has(s)) return s;
  }
}
