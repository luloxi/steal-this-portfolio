import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { getDb } from "@/lib/db";
import { getProjects } from "@/lib/projects-db";
import { getSiteSettings } from "@/lib/site-settings-db";
import { blogPostPath, pathPair } from "@/lib/routes";
import { isPathHidden, orderRecords } from "@/lib/site-sections";
import { getSiteOrder } from "@/lib/site-order";
import type { Locale } from "@/i18n/types";

/** Last real content change of the code-driven pages (bump when their copy changes). */
const PAGES_UPDATED = new Date("2026-11-26T00:00:00-03:00");

/** projects.updated_at by id (read only). Empty when D1 is unavailable. */
async function projectUpdates(): Promise<Map<string, string>> {
  try {
    const db = await getDb();
    if (!db) return new Map();
    const { results } = await db.prepare("SELECT id, updated_at FROM projects").all<{ id: string; updated_at: string | null }>();
    return new Map(results.filter((r) => r.updated_at).map((r) => [r.id, r.updated_at as string]));
  } catch {
    return new Map();
  }
}

export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

/** One <url> per language, each listing both versions as hreflang alternates. */
function both(base: string, paths: Record<Locale, string>, rest: Omit<Entry, "url" | "alternates">): Entry[] {
  const abs = (p: string) => `${base}${p === "/" ? "" : p}`;
  const alternates = { languages: { "es-AR": abs(paths.es), "en-US": abs(paths.en), "x-default": abs(paths.es) } };
  return (["es", "en"] as const).map((l) => ({ url: abs(paths[l]), alternates, ...rest }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Hidden sections and projects (admin strip) are out of the sitemap, both languages.
  const [order, settings, stored, updated] = await Promise.all([getSiteOrder(), getSiteSettings(), getProjects(), projectUpdates()]);
  const shown = (esPath: string) => !isPathHidden(esPath, order.sections, order.projects);
  const pages = ["/", "/servicios", "/recetas", "/sobre-mi", "/proyectos", "/blog", "/contacto", "/referidos", "/privacidad"].filter(shown).flatMap((path) =>
    both(settings.url, pathPair(path), {
      lastModified: PAGES_UPDATED,
      changeFrequency: path === "/blog" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : path === "/servicios" || path === "/recetas" || path === "/contacto" ? 0.9 : 0.7,
    }),
  );
  const projects = orderRecords(stored, order.projects).filter((p) => p.visible && shown(`/proyectos/${p.id}`)).flatMap((p) =>
    both(settings.url, pathPair(`/proyectos/${p.id}`), {
      ...(updated.get(p.id) ? { lastModified: new Date(updated.get(p.id) as string) } : {}),
      changeFrequency: "yearly",
      priority: 0.5,
    }),
  );
  let posts: MetadataRoute.Sitemap = [];
  try {
    posts = (shown("/blog") ? await getPublishedPosts() : []).flatMap((p) =>
      both(settings.url,
        { es: blogPostPath("es", p), en: blogPostPath("en", p) },
        { lastModified: new Date(p.publishedAt), changeFrequency: "monthly", priority: 0.8 },
      ),
    );
  } catch (err) {
    console.error("[sitemap] posts", err);
  }
  return [...pages, ...projects, ...posts];
}
