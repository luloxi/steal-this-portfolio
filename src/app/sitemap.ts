import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { getProjects } from "@/lib/projects-db";
import { getSiteSettings } from "@/lib/site-settings-db";
import { blogPostPath, pathPair } from "@/lib/routes";
import { isPathHidden, orderRecords } from "@/lib/site-sections";
import { getSiteOrder } from "@/lib/site-order";
import type { Locale } from "@/i18n/types";

export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

/** One <url> per language, each listing both versions as hreflang alternates. */
function both(base: string, paths: Record<Locale, string>, rest: Omit<Entry, "url" | "alternates">): Entry[] {
  const abs = (p: string) => `${base}${p === "/" ? "" : p}`;
  const alternates = { languages: { "es-AR": abs(paths.es), "en-US": abs(paths.en), "x-default": abs(paths.es) } };
  return (["es", "en"] as const).map((l) => ({ url: abs(paths[l]), alternates, ...rest }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Hidden sections and projects (admin strip) are out of the sitemap, both languages.
  const [order, settings, stored] = await Promise.all([getSiteOrder(), getSiteSettings(), getProjects()]);
  const shown = (esPath: string) => !isPathHidden(esPath, order.sections, order.projects);
  const pages = ["/", "/sobre-mi", "/proyectos", "/blog", "/contacto", "/contratar", "/referidos", "/privacidad"].filter(shown).flatMap((path) =>
    both(settings.url, pathPair(path), {
      lastModified: now,
      changeFrequency: path === "/blog" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.7,
    }),
  );
  const projects = orderRecords(stored, order.projects).filter((p) => p.visible && shown(`/proyectos/${p.id}`)).flatMap((p) =>
    both(settings.url, pathPair(`/proyectos/${p.id}`), { changeFrequency: "yearly", priority: 0.5 }),
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
