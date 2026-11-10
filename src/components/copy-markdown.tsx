"use client";


import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { deleteSection, introBody, replaceIntro, sectionBody, splitSections, upsertSection } from "@/lib/md-sections";
import { useLocale } from "@/i18n/locale-provider";
import { saveCopy, useEditMode } from "@/components/admin-context";
import { MdWysiwyg, ToolbarButton } from "@/components/md-wysiwyg";
import { withLaugh } from "@/components/laugh-button";
import { COPY_CLASSES } from "@/lib/md-editor-extensions";
import { remarkUnderline } from "@/lib/underline-md";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Site copy rendered as Markdown. No raw HTML (skipHtml), no automatic term
 * linking: only explicit [text](url) links. Single line break = <br>,
 * blank line = new paragraph, so plain text renders like before.
 */
function safeHref(href?: string): string | undefined {
  if (!href) return undefined;
  const h = href.trim();
  if (/^(https?:|mailto:|\/|#)/i.test(h)) return h;
  return undefined;
}

function makeComponents(pClass: string, inline: boolean, rich: boolean): Components {
  const P = inline ? "span" : "p";
  return {
    h1: ({ children }) => (rich ? <h1 className="md-h1">{children}</h1> : <h2 className="md-h2">{children}</h2>),
    h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="md-h4">{children}</h4>,
    h5: ({ children }) => <h4 className="md-h4">{children}</h4>,
    h6: ({ children }) => <h4 className="md-h4">{children}</h4>,
    p: ({ children }) => <P className={pClass}>{withLaugh(children)}</P>,
    hr: () => <hr className="md-hr" />,
    ul: ({ children }) => <ul className="md-ul">{children}</ul>,
    ol: ({ children }) => <ol className="md-ol">{children}</ol>,
    blockquote: ({ children }) => <blockquote className="md-quote">{children}</blockquote>,
    strong: ({ children }) => <strong className="md-strong">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    u: ({ children }) => <u className="rte-u">{children}</u>,
    img: ({ src, alt }) => {
      if (!rich || inline || !src || typeof src !== "string" || !/^(https?:\/\/|\/)/i.test(src)) return null;
      return (
        <span className="rte-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt ?? ""} className="rte-img" loading="lazy" decoding="async" />
          {alt ? <span className="rte-cap">{alt}</span> : null}
        </span>
      );
    },
    a: ({ href, children }) => {
      const h = safeHref(href);
      if (!h || inline) return <span className={inline ? undefined : "md-link"}>{children}</span>;
      const external = /^https?:/i.test(h);
      return (
        <a
          href={h}
          className="cp-prose-link"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  };
}

/** "* text" at line start stays a literal asterisk (footnote style); bullets use "- ". */
function prep(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/^([ \t]*)\*(?=[ \t])/gm, "$1\\*");
}

export function CopyMarkdown({
  text,
  copyKey,
  className = "",
  pClass = "cp-prose",
  inline = false,
  rich = false,
  sections = false,
  afterSection,
  onInsertSection,
  onDeleteSection,
  onBodyChange,
  revealSection,
}: {
  text: string;
  /** site_copy key: when set, the admin can edit this block in place (edit mode). */
  copyKey?: string;
  className?: string;
  pClass?: string;
  /** Inside a link/button: no block elements wrapper, links rendered as text. */
  inline?: boolean;
  /** Project bodies: H1–H3, underline and images (still no raw HTML). */
  rich?: boolean;
  /** Each "## " section becomes a collapsible accordion (intro stays visible). */
  sections?: boolean;
  /** Rendered right after section i (e.g. job cards woven into the story). */
  afterSection?: (i: number, sec: { title: string; body: string }) => ReactNode;
  /** About page: insert a story and keep the layout in step. `at` is the new index (past the end appends). */
  onInsertSection?: (at: number, title: string, text: string) => Promise<string | null>;
  /** About page: remove story `index` from the body and the layout. */
  onDeleteSection?: (index: number) => Promise<string | null>;
  /** Full markdown after an in-place intro or section save, so the page can show it before refresh. */
  onBodyChange?: (markdown: string) => void;
  /** Open this story once (id changes on every insert). */
  revealSection?: { id: number; index: number } | null;
}) {
  const editOn = useEditMode() && Boolean(copyKey) && !inline;
  const { locale } = useLocale();
  if (sections && !inline) {
    const raw = text.replace(/\r\n?/g, "\n");
    const parts = toSections(prep(raw));
    if (parts.sections.length > 0) {
      return (
        <div className={`md-copy md-acc ${className}`.trim()}>
          {editOn ? (
            <EditableBlock
              markdown={prep(introBody(raw))}
              pClass={pClass}
              save={async (md) => {
                const next = replaceIntro(raw, md);
                const err = await saveCopy(copyKey!, locale, next);
                if (!err) onBodyChange?.(next);
                return err;
              }}
            />
          ) : parts.intro.trim() ? (
            <MdBlock text={parts.intro} pClass={pClass} />
          ) : null}
          <Accordion
            sections={parts.sections}
            pClass={pClass}
            raw={raw}
            copyKey={editOn ? copyKey : undefined}
            afterSection={afterSection}
            onInsertSection={editOn ? onInsertSection : undefined}
            onDeleteSection={editOn ? onDeleteSection : undefined}
            onBodyChange={editOn ? onBodyChange : undefined}
            revealSection={revealSection}
          />
        </div>
      );
    }
  }
  if (editOn) {
    return (
      <EditableBlock
        markdown={prep(text)}
        pClass={pClass}
        className={className}
        save={(md) => saveCopy(copyKey!, locale, md)}
      />
    );
  }
  const Wrap = inline ? "span" : "div";
  return (
    <Wrap className={`md-copy ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={rich ? [remarkGfm, remarkBreaks, remarkUnderline] : [remarkGfm, remarkBreaks]}
        skipHtml
        components={makeComponents(pClass, inline, rich)}
        allowedElements={inline ? ["p", "strong", "em", "u", "a", "br", "del", "code"] : undefined}
        unwrapDisallowed
      >
        {prep(text)}
      </ReactMarkdown>
    </Wrap>
  );
}

/** In-place editor that looks like the published block; saves the current locale. */
function EditableBlock({
  markdown,
  pClass,
  className = "",
  save,
  extraDirty,
  forceActive,
  onCancelExtra,
  extraTools,
  bodyFallback,
}: {
  markdown: string;
  pClass: string;
  className?: string;
  /** Receives the edited Markdown and stores it for the current locale. */
  save: (md: string) => Promise<string | null>;
  extraDirty?: boolean;
  forceActive?: boolean;
  onCancelExtra?: () => void;
  extraTools?: ReactNode;
  /** Markdown to save when only something else changed (keeps the body text byte-identical). */
  bodyFallback?: string;
}) {
  const router = useRouter();
  const classes = useMemo(() => ({ ...COPY_CLASSES, p: pClass }), [pClass]);
  return (
    <MdWysiwyg
      markdown={markdown}
      classes={classes}
      className={`md-copy ${className}`.trim()}
      extraDirty={extraDirty}
      forceActive={forceActive}
      onCancelExtra={onCancelExtra}
      extraTools={extraTools}
      onSave={async (md, bodyDirty) => {
        const err = await save(bodyDirty || bodyFallback === undefined ? md : bodyFallback);
        if (!err) router.refresh();
        return err;
      }}
    />
  );
}

function MdBlock({ text, pClass }: { text: string; pClass: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} skipHtml components={makeComponents(pClass, false, false)}>
      {text}
    </ReactMarkdown>
  );
}

type Section = { title: string; body: string };

function toSections(md: string): { intro: string; sections: Section[] } {
  const sp = splitSections(md);
  return {
    intro: sp.intro.join("\n"),
    sections: sp.sections.map((x) => ({
      title: x.title.replace(/[*_`]/g, "").replace(/\\(.)/g, "$1"),
      body: x.lines.join("\n"),
    })),
  };
}

function Accordion({ sections, pClass, raw, copyKey, afterSection, onInsertSection, onDeleteSection, onBodyChange, revealSection }: {
  sections: Section[];
  pClass: string;
  raw: string;
  copyKey?: string;
  afterSection?: (i: number, sec: { title: string; body: string }) => ReactNode;
  onInsertSection?: (at: number, title: string, text: string) => Promise<string | null>;
  onDeleteSection?: (index: number) => Promise<string | null>;
  onBodyChange?: (markdown: string) => void;
  revealSection?: { id: number; index: number } | null;
}) {
  const base = useId();
  const [open, setOpen] = useState<boolean[]>(() => sections.map(() => false));
  const seenReveal = useRef<number | null>(null);
  useEffect(() => {
    if (!revealSection || seenReveal.current === revealSection.id) return;
    seenReveal.current = revealSection.id;
    const at = revealSection.index;
    setOpen((prev) => Array.from({ length: sections.length }, (_, i) => {
      if (i === at) return true;
      if (i > at) return prev[i - 1] ?? false;
      return prev[i] ?? false;
    }));
  }, [revealSection, sections.length]);
  let last = -1;
  open.forEach((o, i) => {
    if (o) last = i;
  });
  let hint = -1;
  for (let i = last + 1; i < sections.length; i++)
    if (!open[i]) {
      hint = i;
      break;
    }
  const toggle = (i: number) => setOpen((prev) => sections.map((_, j) => (j === i ? !prev[j] : (prev[j] ?? false))));
  // While nothing is open, the first section "peeks" (opens a little, holds,
  // closes), synced with every other rev of its header. Not in edit mode or
  // for reduced motion.
  const anyOpen = open.some(Boolean);
  const [peek, setPeek] = useState(false);
  // Off-screen sections pause: CSS header rev (class) and the peek timer.
  const listRef = useRef<HTMLDivElement>(null);
  const [offscreen, setOffscreen] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    const root = listRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      setOffscreen((prev) => {
        const nextSet = new Set(prev);
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.accIndex);
          if (e.isIntersecting) nextSet.delete(i);
          else nextSet.add(i);
        }
        return nextSet;
      });
    });
    root.querySelectorAll<HTMLElement>(":scope > .md-acc-item").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections.length]);
  const peekVisible = !offscreen.has(0);
  // Remaining time to the next peek survives pauses, so it stays in sync with the (paused) CSS rev.
  const peekDue = useRef<number | null>(null);
  useEffect(() => {
    if (anyOpen || copyKey || sections.length === 0) {
      peekDue.current = null;
      return;
    }
    if (!peekVisible) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let next = 0;
    let close = 0;
    let at = 0;
    const loop = (delay: number) => {
      at = performance.now() + delay;
      next = window.setTimeout(() => {
        setPeek(true);
        close = window.setTimeout(() => setPeek(false), 1700);
        loop(10000);
      }, delay);
    };
    // First lunge of the header lands at ~4.95s (1.2s delay + 75% of 5s).
    loop(peekDue.current ?? 4950);
    return () => {
      peekDue.current = Math.max(0, at - performance.now());
      window.clearTimeout(next);
      window.clearTimeout(close);
      setPeek(false);
    };
  }, [anyOpen, copyKey, sections.length, peekVisible]);
  return (
    <div className="md-acc-list" ref={listRef}>
      {afterSection?.(-1, { title: "", body: "" })}
      {sections.map((sec, i) => {
        const isOpen = open[i] ?? false;
        const id = `${base}-s${i}`;
        return (
          <Fragment key={`${id}:${sec.title}`}>
          <section data-acc-index={i} className={`md-acc-item${isOpen ? " is-open" : ""}${offscreen.has(i) ? " is-offscreen" : ""}${peek && i === 0 && !anyOpen ? " md-acc-peek" : ""}`}>
            {copyKey ? (
              <EditableSection
                index={i}
                raw={raw}
                copyKey={copyKey}
                pClass={pClass}
                title={sec.title}
                isOpen={isOpen}
                hint={hint === i}
                panelId={`${id}-panel`}
                onToggle={() => toggle(i)}
                onAdded={() => setOpen((prev) => [...sections.map((_, j) => prev[j] ?? false), true])}
                onInsertSection={onInsertSection}
                onDeleteSection={onDeleteSection}
                onBodyChange={onBodyChange}
              />
            ) : (
              <>
                <h2 className="md-acc-h">
                  <button
                    type="button"
                    id={`${id}-btn`}
                    className={`md-acc-btn${hint === i ? " md-acc-hint" : ""}`}
                    aria-expanded={isOpen}
                    aria-controls={`${id}-panel`}
                    onClick={() => toggle(i)}
                  >
                    <span className="md-acc-title">{sec.title}</span>
                    <Chevron />
                  </button>
                </h2>
                <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} className="md-acc-panel" inert={!isOpen}>
                  <div className="md-acc-inner">
                    <div className="md-acc-body">
                      <MdBlock text={sec.body} pClass={pClass} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
          {afterSection?.(i, { title: sec.title, body: sec.body })}
          </Fragment>
        );
      })}
    </div>
  );
}

function Chevron() {
  return (
    <svg className="md-acc-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Edit mode: title editable in place, body edited in place, same look as published. */
function EditableSection({ index, raw, copyKey, pClass, title, isOpen, hint, panelId, onToggle, onAdded, onInsertSection, onDeleteSection, onBodyChange }: {
  index: number; raw: string; copyKey: string; pClass: string; title: string; isOpen: boolean; hint: boolean;
  panelId: string; onToggle: () => void; onAdded: () => void;
  onInsertSection?: (at: number, title: string, text: string) => Promise<string | null>;
  onDeleteSection?: (index: number) => Promise<string | null>;
  onBodyChange?: (markdown: string) => void;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const es = locale === "es";
  const titleRef = useRef<HTMLSpanElement>(null);
  const [titleDraft, setTitleDraft] = useState(title);
  const [titleFocus, setTitleFocus] = useState(false);
  const split = splitSections(raw);
  const rawSec = split.sections[index];
  const body = rawSec ? sectionBody(rawSec) : "";
  // The title node is contentEditable: React will not replace its text when the
  // section at this index changes (insert or delete). Write it when unfocused.
  useEffect(() => {
    setTitleDraft(title); // eslint-disable-line react-hooks/set-state-in-effect -- keep the draft aligned when the section at this index is replaced
    const el = titleRef.current;
    if (!el || document.activeElement === el) return;
    if (el.textContent !== title) el.textContent = title;
  }, [title]);
  const resetTitle = () => {
    setTitleDraft(title);
    if (titleRef.current) titleRef.current.textContent = title;
  };
  const add = async () => {
    const t = window.prompt(es ? "Título de la nueva sección" : "New section title", es ? "Nueva sección" : "New section");
    if (!t?.trim()) return;
    const text = es ? "Texto de la sección." : "Section text.";
    const err = onInsertSection
      ? await onInsertSection(Number.MAX_SAFE_INTEGER, t.trim(), text)
      : await saveCopy(copyKey, locale, upsertSection(raw, Number.MAX_SAFE_INTEGER, t.trim(), text));
    if (err) window.alert(es ? `No se pudo agregar (${err})` : `Couldn't add (${err})`);
    else if (!onInsertSection) {
      onAdded();
      router.refresh();
    }
  };
  const del = async () => {
    if (!window.confirm(es ? `¿Borrar la sección "${title}"? No se puede deshacer.` : `Delete section "${title}"? This can't be undone.`)) return;
    const err = onDeleteSection
      ? await onDeleteSection(index)
      : await saveCopy(copyKey, locale, deleteSection(raw, index));
    if (err) window.alert(es ? `No se pudo borrar (${err})` : `Couldn't delete (${err})`);
    else if (!onDeleteSection) router.refresh();
  };
  return (
    <>
      <h2 className="md-acc-h">
        <div className={`md-acc-btn md-acc-btn-edit${hint ? " md-acc-hint" : ""}`}>
          <span
            ref={titleRef}
            className="md-acc-title md-acc-title-edit"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={es ? "Título de la sección" : "Section title"}
            spellCheck
            onFocus={() => setTitleFocus(true)}
            onBlur={(e) => {
              if ((e.relatedTarget as HTMLElement | null)?.closest?.("[data-ie-toolbar]")) return;
              setTitleFocus(false);
            }}
            onInput={(e) => setTitleDraft((e.currentTarget.textContent ?? "").replace(/\s+/g, " "))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          >
            {title}
          </span>
          <button
            type="button"
            className="md-acc-del"
            aria-label={es ? `Borrar sección ${title}` : `Delete section ${title}`}
            title={es ? "Borrar sección" : "Delete section"}
            onClick={() => void del()}
          >
            {es ? "Borrar" : "Delete"}
          </button>
          <button
            type="button"
            className="md-acc-chev-btn"
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label={isOpen ? (es ? "Cerrar sección" : "Collapse section") : es ? "Abrir sección" : "Expand section"}
            onClick={onToggle}
          >
            <Chevron />
          </button>
        </div>
      </h2>
      <div id={panelId} role="region" className="md-acc-panel" inert={!isOpen}>
        <div className="md-acc-inner">
          <div className="md-acc-body">
            <EditableBlock
              markdown={prep(body)}
              pClass={pClass}
              bodyFallback={body}
              extraDirty={titleDraft.trim() !== title.trim()}
              forceActive={titleFocus}
              onCancelExtra={resetTitle}
              save={async (md) => {
                const next = upsertSection(raw, index, titleDraft.trim() || title, md);
                const err = await saveCopy(copyKey, locale, next);
                if (!err) onBodyChange?.(next);
                return err;
              }}
              extraTools={
                <>
                  <ToolbarButton label="+§" title={es ? "Agregar sección al final" : "Add section at the end"} onClick={() => void add()} />
                  <ToolbarButton label="🗑" title={es ? "Borrar esta sección" : "Delete this section"} onClick={() => void del()} />
                </>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
