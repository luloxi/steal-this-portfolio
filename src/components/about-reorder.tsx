"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCopy, useEditMode } from "@/components/admin-context";
import { useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/types";
import { splitSections, swapSections } from "@/lib/md-sections";
import { moveBlock, parseLayout, serializeLayout, type LayoutItem } from "@/lib/page-layout";

const L = {
  es: { open: "Ordenar bloques", close: "Listo", title: "Orden de Sobre mí", intro: "La introducción queda siempre arriba. Usá las flechas para mover cada bloque.", up: "Subir", down: "Bajar", job: "Experiencia", pubs: "Publicaciones", talks: "Charlas", saving: "Guardando…", error: "No se pudo guardar", session: "Sesión vencida: volvé a ingresar.", apart: "En inglés el orden es distinto: cambiá a English para ordenarlo ahí.", moved: "movido a la posición" },
  en: { open: "Reorder blocks", close: "Done", title: "About page order", intro: "The intro always stays on top. Use the arrows to move each block.", up: "Move up", down: "Move down", job: "Experience", pubs: "Publications", talks: "Talks", saving: "Saving…", error: "Could not save", session: "Session expired: sign in again.", apart: "The Spanish order is different: switch to Español to reorder it there.", moved: "moved to position" },
} as const;

type Job = { org: string; title: string };

/** Same characters, only whitespace may differ: a reorder never adds or drops text. */
export function sameText(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, "").split("").sort().join("");
  return norm(a) === norm(b);
}

function layoutFor(body: string, layoutRaw: string, jobs: number): { stories: number; layout: LayoutItem[] } {
  const stories = splitSections(body.replace(/\r\n?/g, "\n")).sections.length;
  return { stories, layout: parseLayout(layoutRaw, stories, jobs, 1, 1) };
}

/**
 * Edit mode only: move the blocks of Sobre mí (story chapters, job cards,
 * publications, talks) with up/down buttons (big tap targets for the phone).
 * Saves to D1 (site_copy about.layout, and about.body when two chapters trade
 * places). The other language follows when its blocks are the same.
 */
export function AboutReorder({ body, layoutRaw, timeline }: { body: string; layoutRaw: string; timeline: readonly Job[] }) {
  const editOn = useEditMode();
  const { locale, messagesFor } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [live, setLive] = useState("");
  // Buttons stay off until the page shows the saved order, so the next move starts from it.
  const [refreshing, startRefresh] = useTransition();
  if (!editOn) return null;
  const locked = busy || refreshing;
  const lang: Locale = locale === "en" ? "en" : "es";
  const T = L[lang];
  const other: Locale = lang === "es" ? "en" : "es";
  const mine = layoutFor(body, layoutRaw, timeline.length);
  const titles = splitSections(body.replace(/\r\n?/g, "\n")).sections.map((s) => s.title.replace(/[*_`]/g, ""));

  const label = (it: LayoutItem) =>
    it.kind === "story" ? titles[it.index] ?? `#${it.index + 1}` : it.kind === "job" ? `${T.job}: ${timeline[it.index]?.org || timeline[it.index]?.title || it.index + 1}` : it.kind === "pubs" ? T.pubs : T.talks;

  const applyTo = async (loc: Locale, srcBody: string, items: LayoutItem[], from: number, dir: -1 | 1): Promise<string | null> => {
    const r = moveBlock(items, from, dir);
    if (!r) return null;
    if (r.swapStories) {
      const next = swapSections(srcBody.replace(/\r\n?/g, "\n"), r.swapStories[0], r.swapStories[1]);
      if (!sameText(srcBody, next)) return "guard";
      const err = await saveCopy("about.body", loc, next);
      if (err) return err;
    }
    return saveCopy("about.layout", loc, serializeLayout(r.items));
  };

  const move = async (from: number, dir: -1 | 1) => {
    setBusy(true);
    setMsg("");
    const o = messagesFor(other).about;
    const theirs = layoutFor(o.body, o.layout, o.timeline.length);
    const mirror = theirs.stories === mine.stories && serializeLayout(theirs.layout) === serializeLayout(mine.layout);
    let err = await applyTo(lang, body, mine.layout, from, dir);
    if (!err && mirror) err = await applyTo(other, o.body, theirs.layout, from, dir);
    setBusy(false);
    if (err) {
      setMsg(err === "session" ? T.session : `${T.error} (${err})`);
      return;
    }
    if (!mirror) setMsg(T.apart);
    setLive(`${label(mine.layout[from])} ${T.moved} ${from + dir + 1}`);
    startRefresh(() => router.refresh());
  };

  return (
    <div className="ab-order" data-inline-editor="skip" data-testid="about-reorder">
      {open ? (
        <div className="ab-order-panel" role="group" aria-label={T.title}>
          <div className="ab-order-head">
            <p className="ab-order-title">{T.title}</p>
            <button type="button" className="ab-order-done" onClick={() => setOpen(false)}>{T.close}</button>
          </div>
          <p className="ab-order-hint">{T.intro}</p>
          <ol className="ab-order-list">
            {mine.layout.map((it, i) => (
              <li key={`${it.kind}:${it.index}`} className={`ab-order-item is-${it.kind}`}>
                <span className="ab-order-n" aria-hidden>{i + 1}</span>
                <span className="ab-order-label">{label(it)}</span>
                <button type="button" className="ab-order-btn" disabled={locked || i === 0} aria-label={`${T.up}: ${label(it)}`} title={T.up} onClick={() => void move(i, -1)}>↑</button>
                <button type="button" className="ab-order-btn" disabled={locked || i === mine.layout.length - 1} aria-label={`${T.down}: ${label(it)}`} title={T.down} onClick={() => void move(i, 1)}>↓</button>
              </li>
            ))}
          </ol>
          {locked ? <p className="ab-order-msg">{T.saving}</p> : msg ? <p className="ab-order-msg" role="status">{msg}</p> : null}
        </div>
      ) : (
        <button type="button" className="ab-order-open" onClick={() => setOpen(true)}>⇅ {T.open}</button>
      )}
      <span className="sr-only" aria-live="polite">{live}</span>
    </div>
  );
}
