"use client";

import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { useEditMode, useIsAdmin } from "@/components/admin-context";
import type { BlogPost } from "@/content/blog/types";
import { localizePost } from "@/content/blog/types";
import { useLocale } from "@/i18n/locale-provider";
import { useMemo, useState } from "react";
import { blogPostPath } from "@/lib/routes";

const PAGE_SIZE = 10;

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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

/** Blog index: newest first, search, 10 per page. Admin also sees drafts (muted). */
export function BlogList({ posts, error }: { posts: BlogPost[]; error?: boolean }) {
  const { t, locale, href } = useLocale();
  const isAdmin = useIsAdmin();
  const editOn = useEditMode();
  const es = locale === "es";
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    return [...posts]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .filter((p) => {
        if (p.published === false && !editOn) return false; // edit OFF: drafts hidden, as for a visitor
        if (!words.length) return true;
        // Title, summary, body (both languages) and tags.
        const hay = fold([p.title.es, p.title.en, p.summary.es, p.summary.en, p.body.es, p.body.en, ...(p.tags ?? [])].join(" "));
        return words.every((w) => hay.includes(w));
      });
  }, [posts, query, editOn]);
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
          <p className="cp-prose">{query ? (es ? "Sin resultados." : "No results.") : t.blog.empty}</p>
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
