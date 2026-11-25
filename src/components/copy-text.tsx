"use client";

import { useRouter } from "next/navigation";
import { useState, type ElementType } from "react";
import { createPortal } from "react-dom";
import { saveCopy, useEditMode } from "@/components/admin-context";
import { ToolbarButton } from "@/components/md-wysiwyg";
import { useLocale } from "@/i18n/locale-provider";

/**
 * One line of site copy (a site_copy key) rendered as plain text. In admin
 * edit mode the text itself becomes editable in place (same element, same
 * look); a ✓/✕ bar appears while it differs. Enter saves, Esc cancels.
 * Visitors (and the owner with edit mode off) get the plain element.
 */
export function CopyText({
  copyKey,
  value,
  as = "span",
  className,
  label,
  onSave,
}: {
  copyKey?: string;
  /** Custom save (e.g. a project field); defaults to saveCopy(copyKey). */
  onSave?: (value: string) => Promise<string | null>;
  value: string;
  as?: ElementType;
  className?: string;
  label?: string;
}) {
  const editOn = useEditMode();
  const { locale } = useLocale();
  const router = useRouter();
  const es = locale === "es";
  const [draft, setDraft] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const Tag = as;

  if (!editOn) return <Tag className={className}>{value}</Tag>;

  const dirty = draft !== null && draft !== value;
  const cancel = () => {
    setDraft(null);
    setError("");
    setResetKey((k) => k + 1);
  };
  const confirm = async () => {
    if (!dirty || draft === null) return;
    setSaving(true);
    setError("");
    const err = onSave ? await onSave(draft) : copyKey ? await saveCopy(copyKey, locale, draft) : "no_key";
    setSaving(false);
    if (err) setError(err === "session" ? (es ? "Sesión expirada" : "Session expired") : (es ? `No se pudo guardar (${err})` : `Couldn't save (${err})`));
    else {
      setDraft(null);
      router.refresh();
    }
  };

  return (
    <>
      <Tag
        key={resetKey}
        className={`${className ?? ""} ie-inline-text`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={label ?? copyKey ?? "text"}
        spellCheck
        data-inline-editor="skip"
        // Inside a link or a FAQ <summary>: a click places the caret instead of navigating or toggling.
        onClick={(e: React.MouseEvent<HTMLElement>) => e.preventDefault()}
        onInput={(e: React.FormEvent<HTMLElement>) => setDraft((e.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim())}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void confirm();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
      >
        {value}
      </Tag>
      {dirty || error
        ? createPortal(
            <div className="ie-floatbar" role="toolbar" aria-label={es ? "Texto" : "Text"} data-ie-toolbar="1">
              <span className="ie-tb-status">{es ? "Texto" : "Text"}</span>
              <ToolbarButton label="✓" className="ie-tb-ok" title={es ? "Confirmar y guardar (Enter)" : "Confirm and save (Enter)"} disabled={!dirty || saving} onClick={() => void confirm()} />
              <ToolbarButton label="✕" className="ie-tb-cancel" title={es ? "Cancelar cambios (Esc)" : "Cancel changes (Esc)"} disabled={saving} onClick={cancel} />
              {saving ? <span className="ie-tb-status">…</span> : null}
              {error ? <span className="ie-tb-error" role="alert">{error}</span> : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
