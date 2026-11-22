"use client";

import { CopyMarkdown } from "@/components/copy-markdown";
import Image from "next/image";
import { BlogMarkdown } from "@/components/blog-markdown";
import { PageShell } from "@/components/page-shell";
import { ResearchTopics } from "@/components/research-topics";
import type { BlogPost } from "@/content/blog/types";
import { localizePost } from "@/content/blog/types";
import Link from "next/link";
import { useSectionShown } from "@/components/site-order-context";
import { useLocale } from "@/i18n/locale-provider";
import { useEditModeSwitch, useIsAdmin } from "@/components/admin-context";
import { shouldOfferEditMode } from "@/lib/edit-mode";
import { useBlogPostEditor } from "@/components/blog-post-edit";
import { useRef, useState, type ReactNode } from "react";
import { ReadingProgress } from "@/components/reading-progress";


function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

type Slots = { titleNode: ReactNode; summaryNode: ReactNode; bodyNode: ReactNode; metaPanel: ReactNode; coverNode: ReactNode; dateNode: ReactNode };

/** One post, rendered on the server (D1). Admin edit mode edits it in place. */
export function BlogPostView({ post }: { post: BlogPost }) {
  const isAdmin = useIsAdmin();
  const { on: editOn, set: setEditOn } = useEditModeSwitch();
  if (editOn) return <EditablePost post={post} />;
  return <PostLayout post={post} offer={shouldOfferEditMode(isAdmin, editOn) ? () => setEditOn(true) : undefined} />;
}

/** Owner only, edit mode off: one button to turn it on in place. */
function EditModeOffer({ onEnable }: { onEnable: () => void }) {
  const { locale } = useLocale();
  const es = locale === "es";
  return (
    <div className="edit-offer" role="region" aria-label={es ? "Modo editor" : "Editor mode"} data-testid="edit-offer">
      <p>{es ? "El modo editor está apagado: así ve el artículo un visitante." : "Editor mode is off: this is how a visitor sees the article."}</p>
      <button type="button" className="cover-btn" onClick={onEnable} data-testid="edit-offer-btn">
        {es ? "Activar modo editor" : "Turn on editor mode"}
      </button>
    </div>
  );
}

function EditablePost({ post }: { post: BlogPost }) {
  const slots = useBlogPostEditor(post);
  return <PostLayout post={post} slots={slots} />;
}

function PostLayout({ post, slots, offer }: { post: BlogPost; slots?: Slots; offer?: () => void }) {
  const { t, locale, href } = useLocale();
  const contactShown = useSectionShown("contact");
  const L = localizePost(post, locale);
  const articleRef = useRef<HTMLElement>(null);
  const [coverShape, setCoverShape] = useState<"square" | "wide" | "tall">("square");

  return (
    <PageShell
      reading
      title={t.blog.title}
      backHref="/blog"
      backLabel={t.blog.title}
      footerHref="/blog"
      footerLabel={t.blog.backToBlog}
    >
      <ReadingProgress target={articleRef} />
      {offer ? <EditModeOffer onEnable={offer} /> : null}
      <article ref={articleRef} className="space-y-6">
        <header
          className="cp-panel"
          style={{ ["--cp-accent" as string]: "var(--section-blog)" }}
        >
          <span className="cp-nav-frame" aria-hidden>
            <span className="cp-nav-corner cp-nav-corner-tl" />
            <span className="cp-nav-corner cp-nav-corner-br" />
          </span>
          <div className="cp-panel-inner space-y-3">
            {slots ? slots.coverNode : post.coverImage ? (
              <div className="blog-cover">
                <Image
                  src={post.coverImage}
                  alt=""
                  width={1600}
                  height={1600}
                  sizes="(max-width: 640px) 100vw, 820px"
                  className="blog-cover-img"
                  data-shape={coverShape}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (!img.naturalWidth || !img.naturalHeight) return;
                    const r = img.naturalWidth / img.naturalHeight;
                    setCoverShape(r > 1.25 ? "wide" : r < 0.8 ? "tall" : "square");
                  }}
                  priority
                />
              </div>
            ) : null}
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--cp-accent)]">
              {slots ? slots.dateNode : formatDate(post.publishedAt, locale)}
              {!post.published ? <span className="blog-draft-tag">{t.blog.statusDraft}</span> : null}
            </p>
            {slots ? slots.titleNode : <h1 className="blog-post-title">{L.title}</h1>}
            {slots ? slots.summaryNode : <p className="cp-prose">{L.summary}</p>}
            {slots?.metaPanel}
          </div>
        </header>

        <div
          className="cp-panel"
          style={{ ["--cp-accent" as string]: "var(--section-blog)" }}
        >
          <span className="cp-nav-frame" aria-hidden>
            <span className="cp-nav-corner cp-nav-corner-tl" />
            <span className="cp-nav-corner cp-nav-corner-br" />
          </span>
          <div className="cp-panel-inner">
            {slots ? slots.bodyNode : <BlogMarkdown content={L.body} />}
          </div>
        </div>

        {post.topics && post.topics.length > 0 ? (
          <ResearchTopics ids={post.topics} />
        ) : null}

        <aside
          className="cp-panel"
          style={{ ["--cp-accent" as string]: "var(--section-contact)" }}
        >
          <span className="cp-nav-frame" aria-hidden>
            <span className="cp-nav-corner cp-nav-corner-tl" />
            <span className="cp-nav-corner cp-nav-corner-br" />
          </span>
          <div className="cp-panel-inner space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--cp-accent)]">
              {t.blog.authorHeading}
            </p>
            <CopyMarkdown copyKey="blog.authorBio" text={t.blog.authorBio} />
            {contactShown ? (
              <Link href={href("/contacto")} className="blog-author-contact">
                {t.blog.authorContact}
                <span aria-hidden>▸</span>
              </Link>
            ) : null}
          </div>
        </aside>
      </article>
    </PageShell>
  );
}
