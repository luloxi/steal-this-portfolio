import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { listProjectIds } from "@/lib/projects-db";
import { getPostBySlug, getPostBySlugEn } from "@/lib/blog";
import { EN_PREFIX, LOCALE_HEADER, enToEsPath, localeFromPath } from "@/lib/routes";
import type { Locale } from "@/i18n/types";
import { editModeFromCookie, mayLookUpDrafts } from "@/lib/edit-mode";
import { isPathHidden, sectionForPath } from "@/lib/site-sections";
import { isAdminHeaders, loadSiteOrder } from "@/lib/site-order";
import { getDb } from "@/lib/db";
import { REF_COOKIE, REF_MAX_AGE, REF_PARAM, checkCodeShape } from "@/lib/referrals";
import { getActiveReferrer } from "@/lib/referrals-db";

/**
 * Every page request passes through here and gets the x-lulox-locale request
 * header from its URL (/en/... = en, everything else = es). The header the
 * client sent, if any, is overwritten. No redirect by cookie or Accept-Language:
 * crawlers and visitors see what the URL says.
 *
 * /en/<segment>/... is rewritten to the Spanish route that renders it
 * (/en/hire -> /contratar), so both URLs share one page.
 */
function withLocale(request: NextRequest, locale: Locale) {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return headers;
}

function next(request: NextRequest, locale: Locale) {
  return NextResponse.next({ request: { headers: withLocale(request, locale) } });
}

function rewrite(request: NextRequest, locale: Locale, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url, { request: { headers: withLocale(request, locale) } });
}

function redirect(request: NextRequest, pathname: string, status = 301) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url, status);
}

/**
 * Next renders notFound() thrown inside a dynamic page as an empty
 * `__next_error__` shell (vercel/next.js#99793), so missing posts/projects
 * are detected here and rewritten to an unmatched path: that 404 is fully
 * server-rendered by app/not-found.tsx inside the root layout.
 */
function notFoundRewrite(request: NextRequest, locale: Locale) {
  const url = request.nextUrl.clone();
  url.pathname = "/__not-found";
  url.search = "";
  return NextResponse.rewrite(url, { status: 404, request: { headers: withLocale(request, locale) } });
}

/**
 * Sections and projects hidden from the admin strip are out of the public
 * site: their pages (es and /en, subpages included) answer 404. Only an
 * allowlisted admin with edit mode ON still opens them (marked as hidden).
 * D1 is read only for paths that belong to a section.
 */
/** True when this id is a row in `projects` (hidden rows included: the hide check is separate). */
async function knownProjectId(id: string): Promise<boolean> {
  try {
    return (await listProjectIds(await getDb())).includes(id);
  } catch {
    return false;
  }
}

async function hiddenFromVisitor(request: NextRequest, esPath: string | null): Promise<boolean> {
  if (!esPath || !sectionForPath(esPath)) return false;
  const order = await loadSiteOrder();
  if (!isPathHidden(esPath, order.sections, order.projects)) return false;
  if (!getSessionCookie(request) || !editModeFromCookie(request.headers.get("cookie"))) return true;
  return !(await isAdminHeaders(request.headers));
}

/**
 * ?ref=CODE on any page: remember the referrer for 90 days (cookie lulox-ref,
 * last valid code wins). Only codes of active referrers are stored; anything
 * else leaves the cookie as it was.
 */
async function withRefCookie(request: NextRequest, res: NextResponse): Promise<NextResponse> {
  const raw = request.nextUrl.searchParams.get(REF_PARAM);
  if (!raw) return res;
  const shape = checkCodeShape(raw);
  if (!shape.ok) return res;
  try {
    const db = await getDb();
    if (!db || !(await getActiveReferrer(db, shape.code))) return res;
    res.cookies.set(REF_COOKIE, shape.code, {
      path: "/",
      maxAge: REF_MAX_AGE,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      httpOnly: false, // the hire page reads it to show "Referido por"
    });
  } catch (err) {
    console.error("[proxy] ref cookie", err);
  }
  return res;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Admin pages (/admin/referidos): a real allowlist check; everyone else gets the plain 404.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!getSessionCookie(request) || !(await isAdminHeaders(request.headers))) return notFoundRewrite(request, "es");
  }
  return withRefCookie(request, await route(request));
}

async function route(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const locale = localeFromPath(pathname);

  // Hidden section/project (admin strip): 404 for visitors, before any rewrite.
  // /en/blog/<slug> maps to /blog/<slug> here: only the section matters.
  const esPath = locale === "en" ? enToEsPath(pathname) : pathname;
  if (await hiddenFromVisitor(request, esPath)) return notFoundRewrite(request, locale);

  // The old admin (/rothko) is gone: articles are created and edited on /blog.
  if (pathname === "/rothko" || pathname.startsWith("/rothko/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/blog";
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  if (pathname === "/blog/nuevo") {
    // Cheap cookie check; /api/blog does the real admin check on create.
    if (getSessionCookie(request)) return next(request, "es");
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ----- English: /en/blog/<slug_en> -----
  const enBlog = pathname.match(/^\/en\/blog\/([^/]+)\/?$/);
  if (enBlog) {
    const slug = decodeURIComponent(enBlog[1]);
    // Drafts only for the allowlisted admin with edit mode ON (same as /blog): a signed-in
    // non-admin gets exactly what a visitor gets, so no redirect can leak a draft's slug.
    const admin = await mayLookUpDrafts(Boolean(getSessionCookie(request)), request.headers.get("cookie"), () => isAdminHeaders(request.headers));
    const byEn = await getPostBySlugEn(slug, { includeDrafts: admin });
    if (byEn) return rewrite(request, "en", `/blog/${encodeURIComponent(byEn.slug)}`);
    // Spanish slug under /en: 301 to the English slug (or serve it if the post has none yet).
    const byEs = await getPostBySlug(slug, { includeDrafts: admin });
    if (byEs) {
      return byEs.slugEn && byEs.slugEn !== slug
        ? redirect(request, `${EN_PREFIX}/blog/${encodeURIComponent(byEs.slugEn)}`)
        : rewrite(request, "en", `/blog/${encodeURIComponent(byEs.slug)}`);
    }
    // Admin with edit mode ON: let the page open the draft (it re-checks).
    return admin ? rewrite(request, "en", `/blog/${encodeURIComponent(slug)}`) : notFoundRewrite(request, "en");
  }

  // ----- English: every other /en route -----
  if (locale === "en") {
    const es = enToEsPath(pathname);
    if (!es) return notFoundRewrite(request, "en");
    const project = es.match(/^\/proyectos\/([^/]+)\/?$/);
    if (project && !(await knownProjectId(decodeURIComponent(project[1])))) {
      return notFoundRewrite(request, "en");
    }
    return rewrite(request, "en", es);
  }

  // ----- Spanish (root) -----
  const blog = pathname.match(/^\/blog\/([^/]+)\/?$/);
  if (blog) {
    const slug = decodeURIComponent(blog[1]);
    const post = await getPostBySlug(slug, { includeDrafts: false });
    if (post) return next(request, "es");
    // English slug on the Spanish URL: 301 to the Spanish slug.
    const byEn = await getPostBySlugEn(slug, { includeDrafts: false });
    if (byEn) return redirect(request, `/blog/${encodeURIComponent(byEn.slug)}`);
    // A signed-in admin may open a draft; the page checks the allowlist.
    return getSessionCookie(request) ? next(request, "es") : notFoundRewrite(request, "es");
  }

  const project = pathname.match(/^\/proyectos\/([^/]+)\/?$/);
  if (project) {
    const id = decodeURIComponent(project[1]);
    return (await knownProjectId(id)) ? next(request, "es") : notFoundRewrite(request, "es");
  }

  return next(request, "es");
}

export const config = {
  // Every page (so the locale header is always set by us), not assets/API/media/_next.
  matcher: ["/((?!api/|_next/|media/|__not-found|.*\\.[a-z0-9]+$).*)"],
};
