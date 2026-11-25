import type { BlogPost } from "@/content/blog/types";
import type { Locale } from "@/i18n/types";
import { localizePath } from "@/lib/routes";

/** localStorage key for the owner's published/drafts selector on /blog. */
export const BLOG_LIST_VIEW_KEY = "lulox-blog-list";

export type BlogListView = "published" | "drafts";

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Query, localStorage or any other string: only "drafts" is drafts, everything else is published. */
export function parseBlogListView(value: string | null | undefined): BlogListView {
  return value === "drafts" ? "drafts" : "published";
}

/** /blog or /en/blog, with ?view=drafts when opening the drafts list. */
export function blogListPath(locale: Locale, view: BlogListView = "published"): string {
  const base = localizePath(locale, "/blog");
  return view === "drafts" ? `${base}?view=drafts` : base;
}

/**
 * Index filter: visitors and edit-off never see drafts.
 * With edit mode on, `view` picks Publicados or Borradores.
 */
export function filterBlogPosts(
  posts: readonly BlogPost[],
  opts: { editOn: boolean; view?: BlogListView; query?: string },
): BlogPost[] {
  const view = parseBlogListView(opts.view);
  const words = fold(opts.query ?? "").split(/\s+/).filter(Boolean);
  return [...posts]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((p) => {
      const draft = !p.published;
      if (draft && !opts.editOn) return false;
      if (opts.editOn && view === "published" && draft) return false;
      if (opts.editOn && view === "drafts" && !draft) return false;
      if (!words.length) return true;
      const hay = fold(
        [p.title.es, p.title.en, p.summary.es, p.summary.en, p.body.es, p.body.en, ...(p.tags ?? [])].join(" "),
      );
      return words.every((w) => hay.includes(w));
    });
}
