"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useEditMode } from "@/components/admin-context";
import { CopyText } from "@/components/copy-text";
import { useLocale } from "@/i18n/locale-provider";
import type { FaqItem } from "@/lib/faq";

const L = {
  es: { add: "+ Agregar pregunta", newQ: "Nueva pregunta", newA: "Escribí la respuesta.", up: "Subir", down: "Bajar", del: "Borrar", confirm: "¿Borrar esta pregunta?", yes: "Sí, borrar", no: "No", q: "Pregunta", a: "Respuesta", saving: "Guardando…", error: "No se pudo guardar", session: "Sesión vencida: volvé a ingresar.", empty: "Todavía no hay preguntas." },
  en: { add: "+ Add question", newQ: "New question", newA: "Write the answer.", up: "Move up", down: "Move down", del: "Delete", confirm: "Delete this question?", yes: "Yes, delete", no: "No", q: "Question", a: "Answer", saving: "Saving…", error: "Could not save", session: "Session expired: sign in again.", empty: "No questions yet." },
} as const;

async function putFaq(locale: string, items: FaqItem[]): Promise<string | null> {
  const res = await fetch("/api/faq", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale, items }),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return res.status === 401 ? "session" : (data.error ?? String(res.status));
}

/**
 * Landing FAQ. Visitors get the collapsible list. The owner in edit mode gets
 * every question open: click a question or answer to edit it, ↑ ↓ to move it,
 * ✕ (with a confirm) to delete it, and "+ Agregar pregunta". Each change saves
 * the whole list of the current language to D1 (PUT /api/faq).
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  const editOn = useEditMode();
  const { locale } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirming, setConfirming] = useState<number | null>(null);
  // Controls stay off until the page shows the saved list, so the next change starts from it.
  const [refreshing, startRefresh] = useTransition();
  const T = L[locale === "en" ? "en" : "es"];

  if (!editOn) {
    return (
      <div className="hm-faq">
        {items.map((item, i) => (
          <details key={i} className="hm-faq-item">
            <summary className="hm-faq-q">{item.q}</summary>
            <p className="hm-faq-a">{item.a}</p>
          </details>
        ))}
      </div>
    );
  }

  const locked = busy || refreshing;
  const save = async (next: FaqItem[]): Promise<string | null> => {
    setBusy(true);
    setMsg("");
    const err = await putFaq(locale, next);
    setBusy(false);
    if (err) {
      setMsg(err === "session" ? T.session : `${T.error} (${err})`);
      return err;
    }
    setConfirming(null);
    startRefresh(() => router.refresh());
    return null;
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = items.slice();
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    void save(next);
  };
  // Used by the inline editor (it refreshes the page itself on success).
  const saveField = (i: number, field: "q" | "a") => async (value: string) => {
    const next = items.map((it, k) => (k === i ? { ...it, [field]: value } : it));
    const err = await putFaq(locale, next);
    return err === "session" ? "session" : err;
  };

  return (
    <div className="hm-faq faq-edit" data-inline-editor="skip" data-testid="faq-edit">
      {items.length === 0 ? <p className="faq-edit-empty">{T.empty}</p> : null}
      {items.map((item, i) => (
        <div key={`${i}-${item.q}`} className="hm-faq-item faq-edit-item" data-testid="faq-item">
          <div className="faq-edit-text">
            <CopyText as="p" className="hm-faq-q" value={item.q} label={T.q} onSave={saveField(i, "q")} />
            <CopyText as="p" className="hm-faq-a" value={item.a} label={T.a} onSave={saveField(i, "a")} />
          </div>
          {confirming === i ? (
            <div className="faq-edit-confirm" role="group" aria-label={T.confirm}>
              <span>{T.confirm}</span>
              <button type="button" className="faq-edit-btn is-danger" disabled={locked} onClick={() => void save(items.filter((_, k) => k !== i))}>{T.yes}</button>
              <button type="button" className="faq-edit-btn" disabled={locked} onClick={() => setConfirming(null)}>{T.no}</button>
            </div>
          ) : (
            <div className="faq-edit-tools">
              <button type="button" className="faq-edit-btn faq-edit-icon" disabled={locked || i === 0} aria-label={`${T.up}: ${item.q}`} title={T.up} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="faq-edit-btn faq-edit-icon" disabled={locked || i === items.length - 1} aria-label={`${T.down}: ${item.q}`} title={T.down} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="faq-edit-btn faq-edit-icon is-danger" disabled={locked} aria-label={`${T.del}: ${item.q}`} title={T.del} onClick={() => setConfirming(i)}>✕</button>
            </div>
          )}
        </div>
      ))}
      <div className="faq-edit-foot">
        <button type="button" className="faq-edit-btn faq-edit-add" disabled={locked} onClick={() => void save([...items, { q: T.newQ, a: T.newA }])}>{T.add}</button>
        {locked ? <span className="faq-edit-msg">{T.saving}</span> : msg ? <span className="faq-edit-msg" role="status">{msg}</span> : null}
      </div>
    </div>
  );
}
