"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { emptyProject, newProjectId, projectTitle, type PortfolioProject, type ProjectStatus } from "@/lib/projects";

/**
 * Edit mode on /proyectos: add, reorder, hide and restore. Hiding sets
 * visible = false. Nothing is deleted. Paragraphs stay on the project page.
 */
export function ProjectsAdmin({ projects }: { projects: PortfolioProject[] }) {
  const { locale } = useLocale();
  const es = locale !== "en";
  const L = es ? "es" : "en";
  const router = useRouter();
  const [items, setItems] = useState<PortfolioProject[]>(projects);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (next: PortfolioProject[]) => {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error ?? String(res.status));
      return;
    }
    const data = (await res.json()) as { projects?: PortfolioProject[] };
    if (data.projects) setItems(data.projects);
    router.refresh();
  };

  const patch = (id: string, fn: (p: PortfolioProject) => PortfolioProject) =>
    setItems((list) => list.map((p) => (p.id === id ? fn(p) : p)));

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(to, 0, row);
    setItems(next);
  };

  return (
    <div className="site-editor-block mt-4" style={{ ["--cp-accent" as string]: "var(--section-projects)" }}>
      <p className="cp-prose text-muted">
        {es
          ? "Solo vos ves esto. Quitar oculta el proyecto (no se borra)."
          : "Only you see this. Remove hides the project (nothing is deleted)."}
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((p, i) => (
          <li key={p.id} className="grid gap-2 rounded-xl border border-border p-3" style={{ opacity: p.visible ? 1 : 0.55 }}>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="pub-btn" disabled={busy || i === 0} onClick={() => move(i, -1)}>{es ? "Subir" : "Up"}</button>
              <button type="button" className="pub-btn" disabled={busy || i === items.length - 1} onClick={() => move(i, 1)}>{es ? "Bajar" : "Down"}</button>
              <button type="button" className="pub-btn" disabled={busy} onClick={() => patch(p.id, (row) => ({ ...row, visible: !row.visible }))}>
                {p.visible ? (es ? "Quitar" : "Hide") : (es ? "Restaurar" : "Restore")}
              </button>
              {!p.visible ? <span className="text-muted">{es ? "oculto" : "hidden"}</span> : null}
            </div>
            <label className="pub-field">
              <span>{es ? "Título" : "Title"}</span>
              <input className="ie-field" value={p.copy[L].title} aria-label={es ? "Título" : "Title"} onChange={(e) => patch(p.id, (row) => ({ ...row, copy: { ...row.copy, [L]: { ...row.copy[L], title: e.target.value } } }))} />
            </label>
            <label className="pub-field">
              <span>{es ? "Icono" : "Icon"}</span>
              <input className="ie-field" value={p.icon} placeholder="/projects/icon.svg" aria-label={es ? "Icono" : "Icon"} onChange={(e) => patch(p.id, (row) => ({ ...row, icon: e.target.value }))} />
            </label>
            <label className="pub-field">
              <span>{es ? "URL en vivo" : "Live URL"}</span>
              <input className="ie-field" value={p.liveUrl ?? ""} placeholder="https://" aria-label={es ? "URL en vivo" : "Live URL"} onChange={(e) => patch(p.id, (row) => ({ ...row, liveUrl: e.target.value || undefined }))} />
            </label>
            <label className="pub-field">
              <span>GitHub</span>
              <input className="ie-field" value={p.github} placeholder="https://github.com/" aria-label="GitHub" onChange={(e) => patch(p.id, (row) => ({ ...row, github: e.target.value }))} />
            </label>
            <label className="pub-field">
              <span>{es ? "Estado" : "Status"}</span>
              <select className="ie-field" value={p.status} aria-label={es ? "Estado" : "Status"} onChange={(e) => patch(p.id, (row) => ({ ...row, status: e.target.value as ProjectStatus }))}>
                <option value="live">{es ? "En vivo" : "Live"}</option>
                <option value="disabled">{es ? "Deshabilitado" : "Disabled"}</option>
                <option value="archive">{es ? "Archivado" : "Archived"}</option>
              </select>
            </label>
            <span className="text-muted">{projectTitle(p, L)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="pub-btn"
          disabled={busy}
          onClick={() => {
            const id = newProjectId(items.map((p) => p.id));
            const row = emptyProject(id);
            row.copy[L].title = es ? "Nuevo proyecto" : "New project";
            setItems([...items, row]);
          }}
        >
          {es ? "Agregar proyecto" : "Add project"}
        </button>
        <button type="button" className="pub-btn is-primary" disabled={busy} onClick={() => void save(items)}>
          {busy ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar" : "Save")}
        </button>
        {msg ? <span role="alert">{msg}</span> : null}
      </div>
    </div>
  );
}
