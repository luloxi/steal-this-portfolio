"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { useEditMode, useIsAdmin } from "@/components/admin-context";
import type { BlogPost } from "@/content/blog/types";
import { localizePost } from "@/content/blog/types";
import { useLocale } from "@/i18n/locale-provider";
import { useEffect, useMemo, useState } from "react";
import {
  BLOG_LIST_VIEW_KEY,
  blogListPath,
  filterBlogPosts,
  parseBlogListView,
  type BlogListView,
} from "@/lib/blog-list";
import { blogPostPath } from "@/lib/routes";

const PAGE_SIZE = 10;

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

/** Blog index: newest first, search, 10 per page. Edit mode: Publicados / Borradores selector. */
export function BlogList({
  posts,
  error,
  initialView,
}: {
  posts: BlogPost[];
  error?: boolean;
  /** Set only when the URL has ?view=; otherwise the last localStorage choice is restored after mount. */
  initialView?: BlogListView;
}) {
  const { t, locale, href } = useLocale();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const editOn = useEditMode();
  const es = locale === "es";
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<BlogListView>(initialView ?? "published");
  const showFilter = isAdmin && editOn;

  // When the URL carries ?view= (after a toggle or deleting a draft), follow it.
  if (initialView && initialView !== view) {
    setView(initialView);
  }

  // Persist the URL view; if the URL is silent, restore the last choice by writing ?view=drafts.
  useEffect(() => {
    if (initialView) {
      try {
        localStorage.setItem(BLOG_LIST_VIEW_KEY, initialView);
      } catch {
        /* private mode */
      }
      return;
    }
    let stored: BlogListView = "published";
    try {
      stored = parseBlogListView(localStorage.getItem(BLOG_LIST_VIEW_KEY));
    } catch {
      /* private mode */
    }
    if (stored === "drafts") router.replace(blogListPath(locale, "drafts"), { scroll: false });
  }, [initialView, locale, router]);

  const choose = (next: BlogListView) => {
    setView(next);
    setPage(0);
    try {
      localStorage.setItem(BLOG_LIST_VIEW_KEY, next);
    } catch {
      /* private mode */
    }
    router.replace(blogListPath(locale, next), { scroll: false });
  };

  const filtered = useMemo(
    () => filterBlogPosts(posts, { editOn: showFilter, view, query }),
    [posts, showFilter, view, query],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const shown = filtered.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);

  return (
    <PageShell title={t.blog.title}>
      {isAdmin ? (
        <Link
          href={href("/blog/nuevo")}
          prefetch={false}
          className="blog-fab"
          title={es ? "Crear nuevo artículo" : "New article"}
          aria-label={es ? "Crear nuevo artículo" : "New article"}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      ) : null}
      <div className="space-y-4">
        {error ? (
          <p className="cp-prose text-[color:var(--section-tastes)]">
            {t.blog.loadError}
          </p>
        ) : null}

        {showFilter ? (
          <div className="blog-list-filter" role="tablist" aria-label={t.blog.listFilterLabel} data-testid="blog-list-filter">
            <button
              type="button"
              role="tab"
              aria-selected={view === "published"}
              className={view === "published" ? "is-on" : undefined}
              data-testid="blog-list-published"
              onClick={() => choose("published")}
            >
              {t.blog.listPublished}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "drafts"}
              className={view === "drafts" ? "is-on" : undefined}
              data-testid="blog-list-drafts"
              onClick={() => choose("drafts")}
            >
              {t.blog.listDrafts}
            </button>
          </div>
        ) : null}

        <input
          type="search"
          className="blog-search"
          value={query}
          placeholder={es ? "Buscar por título, palabras o etiquetas" : "Search by title, keywords or tags"}
          aria-label={es ? "Buscar artículos" : "Search articles"}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />

        <ul className="space-y-3">
          {shown.map((post) => {
            const L = localizePost(post, locale);
            const draft = !post.published;
            return (
              <li key={post.slug}>
                <Link
                  href={blogPostPath(locale, post)}
                  className={`cp-panel blog-card group block${draft ? " blog-card-draft" : ""}`}
                  style={{ ["--cp-accent" as string]: "var(--section-blog)" }}
                >
                  <span className="cp-nav-frame" aria-hidden>
                    <span className="cp-nav-corner cp-nav-corner-tl" />
                    <span className="cp-nav-corner cp-nav-corner-br" />
                  </span>
                  <div className="cp-panel-inner flex items-center gap-4">
                    {draft ? (
                      <span className="blog-draft-icon" title={es ? "Borrador" : "Draft"} aria-label={es ? "Borrador" : "Draft"}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
                          <path d="M14 3v5h5" />
                          <path d="M18.4 13.6a1.9 1.9 0 0 1 2.7 2.7L16 21.4l-3.2.8.8-3.2Z" />
                        </svg>
                      </span>
                    ) : post.coverImage ? (
                      <span className="blog-card-icon">
                        <Image
                          src={post.coverImage}
                          alt=""
                          width={56}
                          height={56}
                          className="h-full w-full object-contain"
                        />
                      </span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="cp-row-label blog-card-title text-[0.95rem] leading-snug">
                        {L.title}
                      </p>
                      {/* Drafts: only the draft icon and the title. */}
                      {draft ? null : (
                        <p className="cp-prose mt-2 text-[0.88rem] line-clamp-3">
                          {L.summary}
                        </p>
                      )}
                    </div>
                    {/* Date on the right balances the icon on the left */}
                    <span className="blog-card-side">
                      {draft ? null : <time className="blog-card-date" dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>}
                      <span className="cp-nav-chevron opacity-70 group-hover:opacity-100" aria-hidden>
                        ▸
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {!error && filtered.length === 0 ? (
          <p className="cp-prose">
            {query
              ? (es ? "Sin resultados." : "No results.")
              : showFilter && view === "drafts"
                ? t.blog.emptyDrafts
                : t.blog.empty}
          </p>
        ) : null}

        {pages > 1 ? (
          <nav className="blog-pager" aria-label={es ? "Páginas" : "Pages"}>
            <button type="button" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
              {es ? "‹ Anterior" : "‹ Previous"}
            </button>
            <span>
              {cur + 1} / {pages}
            </span>
            <button type="button" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
              {es ? "Siguiente ›" : "Next ›"}
            </button>
          </nav>
        ) : null}
      </div>
    </PageShell>
  );
}
