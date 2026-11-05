"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Play, Quote, Redo2, Underline, Undo2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { pickImageFile, uploadMedia } from "@/lib/upload-media";
import { parseVideoUrl } from "@/lib/video-embed";

/** Links: web, mail or site-relative only (no javascript:, data:, …). */
function isSafeHref(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  return /^(https?:\/\/|mailto:)/i.test(url);
}
import { useLocale } from "@/i18n/locale-provider";
import { mdExtensions, type MdClasses } from "@/lib/md-editor-extensions";

type Props = {
  /** Markdown source (site copy already escaped with prepCopyMarkdown). */
  markdown: string;
  blog?: boolean;
  /** Portfolio project lead or body: same rich marks and image uploads as the blog. */
  project?: boolean;
  classes?: MdClasses;
  /** Wrapper classes: same as the published wrapper so it looks identical. */
  className?: string;
  /** "inline": Confirm/Cancel save in place. "field": form field (onChange). */
  mode?: "inline" | "field";
  onSave?: (md: string, bodyDirty: boolean) => Promise<string | null>;
  onChange?: (md: string) => void;
  /** Extra dirty state owned by the caller (e.g. a section title). */
  extraDirty?: boolean;
  forceActive?: boolean;
  onCancelExtra?: () => void;
  extraTools?: ReactNode;
  placeholder?: string;
};

/** Only one editable area owns the floating toolbar at a time. */
let activeId: string | null = null;
const subs = new Set<() => void>();
export function setActiveEditor(id: string | null) {
  activeId = id;
  subs.forEach((f) => f());
}
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
export function useActiveEditor() {
  return useSyncExternalStore(subscribe, () => activeId, () => null);
}

const getMd = (e: Editor) => (e.storage as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();

function uploadNote(code: string | undefined, es: boolean): string {
  if (code === "type" || code === "unsupported_type") return es ? "Solo PNG, JPEG, WebP, GIF o AVIF." : "Only PNG, JPEG, WebP, GIF or AVIF.";
  if (code === "size" || code === "too_large") return es ? "La imagen pasa de 8 MB." : "The image is over 8 MB.";
  if (code === "session") return es ? "Sesión expirada." : "Session expired.";
  if (code === "storage_not_configured") return es ? "Falta el almacenamiento." : "Storage is not configured.";
  return es ? `No se pudo subir (${code ?? "?"}).` : `Couldn't upload (${code ?? "?"}).`;
}

function insertImage(editor: Editor, src: string, alt: string) {
  editor.chain().focus().insertContent([{ type: "image", attrs: { src, alt: alt.trim() } }, { type: "paragraph" }]).run();
}

async function uploadAndInsert(editor: Editor, file: File, es: boolean): Promise<string> {
  const r = await uploadMedia(file);
  if (r.error || !r.url) return uploadNote(r.error, es);
  const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  insertImage(editor, r.url, alt);
  return "";
}

function Btn({ label, title, onClick, active, disabled, className, pressed }: { label: ReactNode; title: string; onClick: () => void; active?: boolean; disabled?: boolean; className?: string; pressed?: boolean }) {
  return (
    <button
      type="button"
      className={`ie-tb${className ? ` ${className}` : ""}`}
      title={title}
      aria-label={title}
      aria-pressed={pressed ?? active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Ico({ icon: Icon }: { icon: typeof Bold }) {
  return <Icon size={16} strokeWidth={2.25} aria-hidden />;
}

type Panel = "link" | "image" | "video" | null;

/** Floating toolbar shown while an editable area is active. */
function Toolbar({ editor, es, dirty, saving, error, onConfirm, onCancel, extraTools, blog, rich, onHold }: {
  editor: Editor; es: boolean; dirty: boolean; saving: boolean; error: string;
  onConfirm?: () => void; onCancel?: () => void; extraTools?: ReactNode; blog?: boolean; rich?: boolean;
  onHold: (held: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const [videoUrl, setVideoUrl] = useState("https://");
  const [, force] = useState(0);
  const [bottom, setBottom] = useState<number | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const re = () => force((n) => n + 1);
    editor.on("transaction", re);
    return () => {
      editor.off("transaction", re);
    };
  }, [editor]);
  // Mobile: stick to the bottom of the visible viewport (above the keyboard).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const upd = () => setBottom(window.innerWidth < 700 ? Math.max(0, window.innerHeight - (vv.offsetTop + vv.height)) : null);
    upd();
    vv.addEventListener("resize", upd);
    vv.addEventListener("scroll", upd);
    return () => {
      vv.removeEventListener("resize", upd);
      vv.removeEventListener("scroll", upd);
    };
  }, []);
  const openPanel = (next: Panel) => {
    onHold(next !== null);
    setNote("");
    setPanel(next);
    if (next === "link") {
      setLinkUrl((editor.getAttributes("link").href as string | undefined) || "https://");
      queueMicrotask(() => linkRef.current?.focus());
    }
  };
  const closePanel = () => {
    onHold(false);
    setPanel(null);
    editor.commands.focus();
  };
  useEffect(() => {
    if (!panel) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-ie-toolbar]")) return;
      onHold(false);
      setPanel(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]); // eslint-disable-line react-hooks/exhaustive-deps -- close on outside press or Escape
  const c = () => editor.chain().focus();
  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url || url === "https://") {
      c().extendMarkRange("link").unsetLink().run();
      closePanel();
      return;
    }
    if (!isSafeHref(url)) {
      setNote(es ? "Solo https://, http://, mailto: o rutas del sitio (/…)." : "Only https://, http://, mailto: or site paths (/…).");
      return;
    }
    if (editor.state.selection.empty && !editor.isActive("link")) {
      c().insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }).run();
    } else {
      c().extendMarkRange("link").setLink({ href: url }).run();
    }
    closePanel();
  };
  const uploadFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setNote("");
    onHold(true);
    const msg = await uploadAndInsert(editor, file, es);
    setUploading(false);
    if (msg) {
      setNote(msg);
      onHold(true);
      return;
    }
    closePanel();
  };
  const applyImageUrl = () => {
    const src = imgUrl.trim();
    if (!/^(https?:\/\/|\/)/i.test(src)) {
      setNote(es ? "La URL tiene que empezar con https:// o /." : "The URL has to start with https:// or /.");
      return;
    }
    insertImage(editor, src, imgAlt);
    setImgUrl("");
    setImgAlt("");
    closePanel();
  };
  const applyVideo = () => {
    const raw = videoUrl.trim();
    const v = raw && raw !== "https://" ? parseVideoUrl(raw) : null;
    if (!v) {
      setNote(es ? "Solo videos de YouTube o Vimeo." : "Only YouTube or Vimeo videos.");
      return;
    }
    c().insertContent([{ type: "videoEmbed", attrs: { src: raw, title: v.provider === "vimeo" ? "Vimeo" : "YouTube" } }, { type: "paragraph" }]).run();
    closePanel();
  };
  const stop = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea")) return;
    e.preventDefault();
  };
  return createPortal(
    <div className="ie-floatbar" role="toolbar" aria-label={es ? "Edición" : "Editing"} style={bottom !== null ? { bottom } : undefined} data-ie-toolbar="1">
      <div className="ie-floatbar-row">
      {rich ? (
        <>
          <Btn label="H1" title={es ? "Título 1" : "Heading 1"} active={editor.isActive("heading", { level: 1 })} onClick={() => c().toggleHeading({ level: 1 }).run()} />
          <Btn label="H2" title={es ? "Título 2" : "Heading 2"} active={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()} />
          <Btn label="H3" title={es ? "Título 3" : "Heading 3"} active={editor.isActive("heading", { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()} />
        </>
      ) : (
        <>
          <Btn label="H2" title={es ? "Título 2" : "Heading 2"} active={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()} />
          <Btn label="H3" title={es ? "Título 3" : "Heading 3"} active={editor.isActive("heading", { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()} />
          <Btn label="H4" title={es ? "Título 4" : "Heading 4"} active={editor.isActive("heading", { level: 4 })} onClick={() => c().toggleHeading({ level: 4 }).run()} />
        </>
      )}
      <span className="ie-tb-sep" />
      <Btn label={<Ico icon={Bold} />} title={es ? "Negrita (Ctrl+B)" : "Bold (Ctrl+B)"} active={editor.isActive("bold")} onClick={() => c().toggleBold().run()} />
      <Btn label={<Ico icon={Italic} />} title={es ? "Cursiva (Ctrl+I)" : "Italic (Ctrl+I)"} active={editor.isActive("italic")} onClick={() => c().toggleItalic().run()} />
      {rich ? <Btn label={<Ico icon={Underline} />} title={es ? "Subrayado (Ctrl+U)" : "Underline (Ctrl+U)"} active={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()} /> : null}
      <Btn label={<Ico icon={Link2} />} title={es ? "Link" : "Link"} active={editor.isActive("link")} pressed={panel === "link" || editor.isActive("link")} onClick={() => (panel === "link" ? closePanel() : openPanel("link"))} />
      {rich ? (
        <Btn label={uploading ? "…" : <Ico icon={ImagePlus} />} title={es ? "Imagen: subir, pegar o soltar" : "Image: upload, paste or drop"} disabled={uploading} pressed={panel === "image"} onClick={() => (panel === "image" ? closePanel() : openPanel("image"))} />
      ) : null}
      {blog ? <Btn label={<Ico icon={Play} />} title={es ? "Video de YouTube o Vimeo" : "YouTube or Vimeo video"} pressed={panel === "video"} onClick={() => (panel === "video" ? closePanel() : openPanel("video"))} /> : null}
      <span className="ie-tb-sep" />
      <Btn label={<Ico icon={Minus} />} title={es ? "Separador" : "Divider"} onClick={() => c().setHorizontalRule().run()} />
      <Btn label={<Ico icon={List} />} title={es ? "Lista" : "Bulleted list"} active={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()} />
      <Btn label={<Ico icon={ListOrdered} />} title={es ? "Lista numerada" : "Numbered list"} active={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()} />
      <Btn label={<Ico icon={Quote} />} title={es ? "Cita" : "Quote"} active={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()} />
      <span className="ie-tb-sep" />
      <Btn label={<Ico icon={Undo2} />} title={es ? "Deshacer" : "Undo"} disabled={!editor.can().undo()} onClick={() => c().undo().run()} />
      <Btn label={<Ico icon={Redo2} />} title={es ? "Rehacer" : "Redo"} disabled={!editor.can().redo()} onClick={() => c().redo().run()} />
      {extraTools ? (
        <>
          <span className="ie-tb-sep" />
          {extraTools}
        </>
      ) : null}
      {onConfirm ? (
        <>
          <span className="ie-tb-sep" />
          <Btn label="✓" className="ie-tb-ok" title={es ? "Confirmar y guardar" : "Confirm and save"} disabled={!dirty || saving} onClick={onConfirm} />
          <Btn label="✕" className="ie-tb-cancel" title={es ? "Cancelar cambios" : "Cancel changes"} disabled={saving} onClick={() => onCancel?.()} />
        </>
      ) : null}
      {saving ? <span className="ie-tb-status">…</span> : null}
      {error || note ? <span className="ie-tb-error" role="alert">{error || note}</span> : null}
      </div>
      {panel ? (
        <form
          className="ie-pop"
          data-ie-toolbar="1"
          onMouseDown={stop}
          onSubmit={(e) => {
            e.preventDefault();
            if (panel === "link") applyLink();
            else if (panel === "image") applyImageUrl();
            else applyVideo();
          }}
        >
          {panel === "link" ? (
            <>
              <label className="ie-pop-label" htmlFor="ie-link-url">{es ? "Link" : "Link"}</label>
              <input id="ie-link-url" ref={linkRef} className="ie-pop-input" type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={linkUrl} placeholder="https://" onChange={(e) => setLinkUrl(e.target.value)} />
              <div className="ie-pop-row">
                <button type="submit" className="ie-tb ie-tb-wide">{es ? "Aplicar" : "Apply"}</button>
                <button type="button" className="ie-tb ie-tb-wide" onMouseDown={(e) => e.preventDefault()} onClick={() => { c().extendMarkRange("link").unsetLink().run(); closePanel(); }}>{es ? "Quitar" : "Remove"}</button>
              </div>
            </>
          ) : null}
          {panel === "image" ? (
            <>
              <button
                type="button"
                className="ie-tb ie-tb-wide ie-pop-upload"
                disabled={uploading}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onHold(true);
                  void pickImageFile().then((file) => uploadFile(file));
                }}
              >
                {uploading ? (es ? "Subiendo…" : "Uploading…") : (es ? "Subir imagen" : "Upload image")}
              </button>
              <label className="ie-pop-label" htmlFor="ie-img-url">{es ? "o una URL" : "or a URL"}</label>
              <input id="ie-img-url" className="ie-pop-input" type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={imgUrl} placeholder="https://… o /media/…" onChange={(e) => setImgUrl(e.target.value)} />
              <label className="ie-pop-label" htmlFor="ie-img-alt">{es ? "Epígrafe" : "Caption"}</label>
              <input id="ie-img-alt" className="ie-pop-input" type="text" value={imgAlt} placeholder={es ? "opcional" : "optional"} onChange={(e) => setImgAlt(e.target.value)} />
              <div className="ie-pop-row">
                <button type="submit" className="ie-tb ie-tb-wide">{es ? "Insertar" : "Insert"}</button>
              </div>
            </>
          ) : null}
          {panel === "video" ? (
            <>
              <label className="ie-pop-label" htmlFor="ie-video-url">{es ? "YouTube o Vimeo" : "YouTube or Vimeo"}</label>
              <input id="ie-video-url" className="ie-pop-input" type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={videoUrl} placeholder="https://" onChange={(e) => setVideoUrl(e.target.value)} />
              <div className="ie-pop-row">
                <button type="submit" className="ie-tb ie-tb-wide">{es ? "Insertar" : "Insert"}</button>
              </div>
            </>
          ) : null}
        </form>
      ) : null}
    </div>,
    document.body,
  );
}

export function MdWysiwyg({ markdown, blog, project, classes, className = "", mode = "inline", onSave, onChange, extraDirty = false, forceActive = false, onCancelExtra, extraTools }: Props) {
  const { locale } = useLocale();
  const es = locale === "es";
  const rich = Boolean(blog || project);
  const baseline = useRef<string>("");
  const [dirtyBody, setDirtyBody] = useState(false);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dropping, setDropping] = useState(false);
  const holdRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const esRef = useRef(es);
  const richRef = useRef(rich);
  useEffect(() => {
    esRef.current = es;
    richRef.current = rich;
  });
  const myId = useId();
  const current = useActiveEditor();
  const extensions = useMemo(() => mdExtensions({ blog, project, classes }), [blog, project, classes]);

  const takeImage = (file: File) => {
    const ed = editorRef.current;
    if (!ed) return false;
    void uploadAndInsert(ed, file, esRef.current).then((msg) => {
      if (msg) setError(msg);
    });
    return true;
  };

  const editor = useEditor({
    extensions,
    content: markdown,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "md-pm", spellcheck: "true" },
      handlePaste(_view, event) {
        if (!richRef.current) return false;
        const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        takeImage(file);
        return true;
      },
      handleDrop(_view, event) {
        if (!richRef.current) return false;
        const file = Array.from(event.dataTransfer?.files ?? []).find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        setDropping(false);
        takeImage(file);
        return true;
      },
    },
    onCreate: ({ editor: e }) => {
      editorRef.current = e;
      baseline.current = getMd(e);
    },
    onUpdate: ({ editor: e }) => {
      const md = getMd(e);
      setDirtyBody(md !== baseline.current);
      onChange?.(md);
    },
    onFocus: () => {
      setFocused(true);
      setActiveEditor(myId);
    },
    onBlur: ({ event }) => {
      const to = (event as FocusEvent | undefined)?.relatedTarget as HTMLElement | null;
      if (to?.closest?.("[data-ie-toolbar]")) return;
      if (holdRef.current) return;
      setFocused(false);
    },
  });

  // New source from the server (after a save/refresh): reload if untouched.
  useEffect(() => {
    if (!editor || dirtyBody) return;
    editor.commands.setContent(markdown, false);
    baseline.current = getMd(editor);
  }, [editor, markdown]); // eslint-disable-line react-hooks/exhaustive-deps -- only on new source

  const dirty = dirtyBody || extraDirty;

  const cancel = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(markdown, false);
    baseline.current = getMd(editor);
    setDirtyBody(false);
    setError("");
    onCancelExtra?.();
    editor.commands.blur();
    setFocused(false);
  }, [editor, markdown, onCancelExtra]);

  const confirm = useCallback(async () => {
    if (!editor || !onSave) return;
    setSaving(true);
    setError("");
    const md = getMd(editor);
    const err = await onSave(md, dirtyBody);
    setSaving(false);
    if (err) {
      const known: Record<string, [string, string]> = {
        session: ["Sesión expirada", "Session expired"],
        too_long: ["El texto es demasiado largo para guardarlo.", "The text is too long to save."],
      };
      const pair = known[err];
      setError(pair ? pair[es ? 0 : 1] : (es ? `No se pudo guardar (${err})` : `Couldn't save (${err})`));
      return;
    }
    baseline.current = md;
    setDirtyBody(false);
    editor.commands.blur();
    setFocused(false);
  }, [editor, onSave, dirtyBody, es]);

  useEffect(() => {
    if (forceActive) setActiveEditor(myId);
  }, [forceActive, myId]);
  const active = Boolean(editor) && current === myId && (focused || forceActive || (mode === "inline" && dirty));

  return (
    <div
      className={`md-edit ${dropping ? "is-drop" : ""} ${className}`.trim()}
      onDragOver={(e) => {
        if (!rich || !e.dataTransfer?.types?.includes("Files")) return;
        e.preventDefault();
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={() => setDropping(false)}
    >
      <EditorContent editor={editor} />
      {active && editor ? (
        <Toolbar
          editor={editor}
          es={es}
          dirty={dirty}
          saving={saving}
          error={error}
          onConfirm={mode === "inline" ? () => void confirm() : undefined}
          onCancel={cancel}
          extraTools={extraTools}
          blog={blog}
          rich={rich}
          onHold={(held) => { holdRef.current = held; }}
        />
      ) : null}
    </div>
  );
}

export { Btn as ToolbarButton };
