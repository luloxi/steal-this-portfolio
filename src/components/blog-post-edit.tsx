"use client";

import { useRouter } from "next/navigation";
import { CoverPicker } from "@/components/cover-picker";
import { useRef, useState, type ReactNode } from "react";
import { MdWysiwyg, ToolbarButton } from "@/components/md-wysiwyg";
import { SectionReorder } from "@/components/section-reorder";
import { joinSections, moveItem, splitSections } from "@/lib/article-sections";
import type { BlogPost } from "@/content/blog/types";
import { focusTopics } from "@/content/projects";
import { useLocale } from "@/i18n/locale-provider";
import { blogListPath } from "@/lib/blog-list";
import { blogPostPath, slugify } from "@/lib/routes";

export async function putPost(post: BlogPost & { previousSlug?: string }): Promise<{ slug?: string; slugEn?: string | null; error?: string }> {
  const res = await fetch("/api/blog", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  if (res.ok) return (await res.json()) as { slug: string; slugEn: string | null };
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { error: res.status === 401 ? "session" : (data.error ?? String(res.status)) };
}

type Meta = { slug: string; slugEn: string; publishedAt: string; coverImage: string; tags: string; topics: string[] };
const metaOf = (p: BlogPost): Meta => ({
  slug: p.slug,
  slugEn: p.slugEn ?? "",
  publishedAt: p.publishedAt.slice(0, 10),
  coverImage: p.coverImage ?? "",
  tags: (p.tags ?? []).join(", "),
  topics: p.topics ?? [],
});
const sameMeta = (a: Meta, b: Meta) =>
  a.slug === b.slug && a.slugEn === b.slugEn && a.publishedAt === b.publishedAt && a.coverImage === b.coverImage && a.tags === b.tags && a.topics.join() === b.topics.join();

/** Plain-text field edited in place (title, summary): looks like the rendered text. */
function InlineText({ as: Tag, className, value, label, onChange, onFocus, onBlur, resetKey }: {
  as: "h1" | "p"; className: string; value: string; label: string; resetKey: number;
  onChange: (v: string) => void; onFocus: () => void; onBlur: () => void;
}) {
  return (
    <Tag
      key={resetKey}
      className={`${className} ie-inline-text`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      spellCheck
      onFocus={onFocus}
      onBlur={(e) => {
        if ((e.relatedTarget as HTMLElement | null)?.closest?.("[data-ie-toolbar]")) return;
        onBlur();
      }}
      onInput={(e) => onChange((e.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}

/**
 * Admin edit mode for one post at /blog/<slug>: title, summary and body edited
 * in place for the current locale, details (date, tags, slug, cover, topics)
 * inline; publish/unpublish and delete in the toolbar. The article renders like the published one.
 */
export function useBlogPostEditor(post: BlogPost) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const es = locale === "es";
  const L = (locale === "en" ? "en" : "es") as "es" | "en";
  const [title, setTitle] = useState(post.title[L]);
  const [summary, setSummary] = useState(post.summary[L]);
  const [meta, setMeta] = useState<Meta>(metaOf(post));
  const [textFocus, setTextFocus] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const bodyRef = useRef(post.body[L]);
  // Bodies after section reorders (both languages move together when they line up).
  const [bodies, setBodies] = useState(post.body);
  const [reorderNote, setReorderNote] = useState("");
  const [liveBody, setLiveBody] = useState(post.body[L]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const O = (L === "es" ? "en" : "es") as "es" | "en";
  const moveSection = (from: number, to: number) => {
    const cur = splitSections(bodyRef.current);
    const nextL = joinSections(moveItem(cur, from, to));
    const other = splitSections(bodies[O] ?? "");
    const sync = other.length === cur.length;
    setBodies({ ...bodies, [L]: nextL, ...(sync ? { [O]: joinSections(moveItem(other, from, to)) } : {}) });
    setReorderNote(sync || !(bodies[O] ?? "").trim() ? "" : es
      ? "La versión en inglés tiene otra cantidad de secciones: reordenala por separado."
      : "The Spanish version has a different number of sections: reorder it separately.");
    bodyRef.current = nextL;
    setLiveBody(nextL);
  };
  const reordered = bodies.es !== post.body.es || bodies.en !== post.body.en;
  const extraDirty = reordered || title !== post.title[L] || summary !== post.summary[L] || !sameMeta(meta, metaOf(post));

  const build = (bodyMd: string, published = post.published): BlogPost => ({
    ...post,
    slug: meta.slug.trim() || post.slug,
    slugEn: meta.slugEn.trim().toLowerCase() || null,
    publishedAt: meta.publishedAt,
    coverImage: meta.coverImage.trim(),
    tags: meta.tags.split(",").map((x) => x.trim()).filter(Boolean),
    topics: meta.topics,
    published,
    title: { ...post.title, [L]: title || post.title[L] },
    summary: { ...post.summary, [L]: summary },
    body: { ...bodies, [L]: bodyMd },
  });

  const commit = async (next: BlogPost): Promise<string | null> => {
    // previousSlug: a Spanish slug rename is done server-side in one batch (new row in, old row out).
    const r = await putPost({ ...next, previousSlug: post.slug });
    if (r.error) {
      const msg: Record<string, [string, string]> = {
        invalid_slug_en: ["slug EN: solo minúsculas, números y guiones, sin tildes", "EN slug: lowercase letters, numbers and hyphens only"],
        slug_en_taken: ["ese slug EN ya lo usa otro artículo", "that EN slug is already used by another article"],
        slug_taken: ["ese slug ya lo usa otro artículo", "that slug is already used by another article"],
      };
      return msg[r.error]?.[es ? 0 : 1] ?? r.error;
    }
    const saved = { slug: r.slug ?? post.slug, slugEn: r.slugEn ?? null };
    const target = blogPostPath(L, saved);
    if (target !== blogPostPath(L, post)) router.replace(target);
    router.refresh();
    return null;
  };

  const togglePublish = async () => {
    const err = await commit(build(bodyRef.current, !post.published));
    if (err) window.alert(es ? `No se pudo guardar (${err})` : `Couldn't save (${err})`);
  };
  const del = async () => {
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/blog?slug=${encodeURIComponent(post.slug)}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: post.slug }),
    });
    if (!res.ok) {
      setDeleting(false);
      setDeleteError(es ? `No se pudo borrar (${res.status})` : `Couldn't delete (${res.status})`);
      return;
    }
    // Don't refresh this route after the delete: that 404s the draft page
    // and can swallow the navigation back to the list.
    router.replace(blogListPath(L, "drafts"));
  };
  const cancelExtra = () => {
    setTitle(post.title[L]);
    setSummary(post.summary[L]);
    setMeta(metaOf(post));
    setBodies(post.body);
    bodyRef.current = post.body[L];
    setLiveBody(post.body[L]);
    setReorderNote("");
    setResetKey((k) => k + 1);
  };

  const titleNode = (
    <InlineText as="h1" className="blog-post-title" value={post.title[L]} label={t.blog.fieldTitle} resetKey={resetKey}
      onChange={setTitle} onFocus={() => setTextFocus(true)} onBlur={() => setTextFocus(false)} />
  );
  const summaryNode = (
    <InlineText as="p" className="cp-prose blog-dek-edit" value={post.summary[L]} label={t.blog.fieldSummary} resetKey={resetKey}
      onChange={setSummary} onFocus={() => setTextFocus(true)} onBlur={() => setTextFocus(false)} />
  );

  // Details edited in place, styled like the surrounding muted text.
  const coverNode: ReactNode = (
    <CoverPicker value={meta.coverImage} onChange={(url) => setMeta((m) => ({ ...m, coverImage: url }))} es={es} />
  );
  const dateNode: ReactNode = (
    <input
      type="date"
      className="ie-date-inline"
      value={meta.publishedAt}
      onChange={(e) => setMeta({ ...meta, publishedAt: e.target.value })}
      aria-label={t.blog.fieldDate}
      title={t.blog.fieldDate}
    />
  );
  const field = (k: "slug" | "slugEn" | "tags" | "coverImage", label: string, placeholder: string) => (
    <label className="ie-meta-line">
      <span className="ie-meta-key">{label}</span>
      <input
        className="ie-meta-input"
        value={meta[k]}
        placeholder={placeholder}
        onChange={(e) => setMeta({ ...meta, [k]: e.target.value })}
        spellCheck={false}
      />
    </label>
  );
  const metaPanel: ReactNode = (
    <div className="ie-meta-inline" data-ie-toolbar="1">
      {field("tags", t.blog.fieldTags, es ? "palabras, clave" : "some, keywords")}
      {field("slug", "slug (ES)", "mi-articulo")}
      {field("slugEn", "slug (EN)", slugify(post.title.en) || "my-article")}
      {field("coverImage", t.blog.fieldCover, "https://… / /media/…")}
      <div className="ie-meta-line" role="group" aria-label={t.blog.fieldTopics}>
        <span className="ie-meta-key">{t.blog.fieldTopics}</span>
        <span className="ie-topic-chips">
          {focusTopics.map((ft) => {
            const on = meta.topics.includes(ft.id);
            return (
              <button
                key={ft.id}
                type="button"
                className={`ie-topic-chip${on ? " is-on" : ""}`}
                aria-pressed={on}
                onClick={() => setMeta({ ...meta, topics: on ? meta.topics.filter((x) => x !== ft.id) : [...meta.topics, ft.id] })}
              >
                {ft.id}
              </button>
            );
          })}
        </span>
      </div>
    </div>
  );

  const bodyNode = (
    <>
    <SectionReorder sections={splitSections(liveBody)} onMove={moveSection} es={es} note={reorderNote} />
    <MdWysiwyg
      markdown={bodies[L]}
      blog
      className="blog-md blog-md-page"
      placeholder={es ? "Escribí tu artículo…" : "Write your article…"}
      forceActive
      extraDirty={extraDirty}
      onCancelExtra={cancelExtra}
      onChange={(md) => {
        bodyRef.current = md;
        setLiveBody(md);
      }}
      onSave={(md, bodyDirty) => commit(build(bodyDirty ? md : bodies[L]))}
      extraTools={
        <>
          <ToolbarButton
            label={post.published ? (es ? "Despublicar" : "Unpublish") : es ? "Publicar" : "Publish"}
            className="ie-tb-wide"
            title={post.published ? (es ? "Pasar a borrador" : "Back to draft") : es ? "Publicar el artículo" : "Publish the article"}
            onClick={() => void togglePublish()}
          />
          <span data-testid="blog-delete">
            <ToolbarButton label="🗑" title={es ? "Borrar artículo" : "Delete article"} onClick={() => { setDeleteError(""); setConfirmDelete(true); }} />
          </span>
        </>
      }
    />
    </>
  );

  const confirmNode = confirmDelete ? (
    <div className="blog-del-confirm" role="alertdialog" aria-labelledby="blog-del-title" aria-describedby="blog-del-undo" data-testid="blog-delete-confirm">
      <p id="blog-del-title" className="blog-del-title">
        {es ? `¿Borrar "${post.title[L] || t.blog.statusDraft}"?` : `Delete "${post.title[L] || t.blog.statusDraft}"?`}
      </p>
      <p id="blog-del-undo" className="blog-del-undo">{t.blog.confirmDeleteUndo}</p>
      {deleteError ? <p className="blog-del-error" role="alert">{deleteError}</p> : null}
      <div className="blog-del-actions">
        <button
          type="button"
          className="blog-del-yes"
          data-testid="blog-delete-yes"
          disabled={deleting}
          onClick={() => void del()}
        >
          {deleting ? (es ? "Borrando…" : "Deleting…") : t.blog.confirmDeleteYes}
        </button>
        <button
          type="button"
          className="blog-del-no"
          data-testid="blog-delete-no"
          disabled={deleting}
          onClick={() => { setConfirmDelete(false); setDeleteError(""); }}
        >
          {es ? "No" : "No"}
        </button>
      </div>
    </div>
  ) : null;

  return { titleNode, summaryNode, bodyNode, metaPanel, coverNode, dateNode, textFocus, confirmNode };
}
