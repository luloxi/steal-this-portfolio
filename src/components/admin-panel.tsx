"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminPanel, useEditModeSwitch } from "@/components/admin-context";
import { AdminSettings, type SettingsTab } from "@/components/admin-settings";
import { useSiteOrder } from "@/components/site-order-context";
import { Tip } from "@/components/tip";
import { sections as sectionCatalog } from "@/content/site";
import { useLocale } from "@/i18n/locale-provider";
import { defaultOrder, moveItem, SECTION_KEYS, type OrderItem, type OrderKind, type SectionKey } from "@/lib/site-sections";
import { useRouter } from "next/navigation";

type Labels = Record<string, { es: string; en: string }>;
type Tab = "sections" | SettingsTab | "projects";

/**
 * Admin panel, opened from the profile menu ("Personalizar"). One modal with
 * four tabs: Secciones, Apariencia, Info personal, Proyectos. Help text only
 * lives in tooltips (hover, or long-press on touch). Changes save to D1.
 */
export function AdminPanel({ projectLabels }: { projectLabels: Labels }) {
  const { open, setOpen } = useAdminPanel();
  if (!open) return null;
  return <PanelBody projectLabels={projectLabels} onClose={() => setOpen(false)} />;
}

function PanelBody({ projectLabels, onClose }: { projectLabels: Labels; onClose: () => void }) {
  const { locale, t, href } = useLocale();
  const es = locale !== "en";
  const router = useRouter();
  const edit = useEditModeSwitch();
  const order = useSiteOrder();
  const { projects, save } = order;
  const sections = order.sections.length ? order.sections : defaultOrder(SECTION_KEYS);
  const [tab, setTab] = useState<Tab>("sections");
  const [error, setError] = useState("");
  const [live, setLive] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("adm-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("adm-open");
      prev?.focus?.();
    };
  }, [onClose]);

  const tabs: [Tab, string, string][] = [
    ["sections", es ? "Secciones" : "Sections", es ? "Mostrar, ocultar, ordenar y editar las secciones del sitio" : "Show, hide, reorder and edit the site sections"],
    ["appearance", es ? "Apariencia" : "Appearance", es ? "Colores del sitio en modo oscuro y claro" : "Site colors in dark and light mode"],
    ["info", es ? "Info personal" : "Personal info", es ? "Tu nombre, tu foto, tus links y tu contacto" : "Your name, photo, links and contact"],
    ["projects", es ? "Proyectos" : "Projects", es ? "Mostrar, ocultar, ordenar y editar tus proyectos" : "Show, hide, reorder and edit your projects"],
  ];

  const sectionLabel = useCallback((key: string) => t.sections[key as SectionKey] ?? key, [t]);
  const projectLabel = useCallback((key: string) => projectLabels[key]?.[locale] ?? projectLabels[key]?.es ?? key, [projectLabels, locale]);
  const sectionHref = useMemo(() => Object.fromEntries(sectionCatalog.map((s) => [s.id, s.href])), []);

  const commit = async (kind: OrderKind, next: OrderItem[], message: string) => {
    setError("");
    setLive(message);
    const err = await save(kind, next);
    if (err) {
      const msg = err === "session" ? (es ? "Sesión vencida: volvé a ingresar." : "Session expired: sign in again.") : (es ? `No se pudo guardar (${err}).` : `Could not save (${err}).`);
      setError(msg);
      setLive(msg);
      return;
    }
    router.refresh();
  };

  const goEdit = () => {
    if (!edit.on) edit.set(true);
    onClose();
  };

  const row = (kind: OrderKind, items: OrderItem[], idx: number, label: string, editHref: string) => {
    const it = items[idx];
    return (
      <li className={`adm-row${it.visible ? "" : " is-off"}`} key={it.key} data-key={it.key}>
        <Tip text={es ? "Abrir y editar esta página" : "Open and edit this page"} className="adm-row-name">
          <Link href={editHref} className="adm-row-link" onClick={goEdit} aria-label={es ? `Editar ${label}` : `Edit ${label}`}>
            {label}
          </Link>
        </Tip>
        <Tip text={it.visible ? (es ? "Visible en el sitio. Tocá para ocultarla" : "Visible on the site. Tap to hide it") : (es ? "Oculta del sitio. Tocá para mostrarla" : "Hidden from the site. Tap to show it")}>
          <button
            type="button"
            role="switch"
            aria-checked={it.visible}
            aria-label={`${label}: ${it.visible ? (es ? "visible" : "visible") : (es ? "oculta" : "hidden")}`}
            className="adm-switch"
            onClick={() => void commit(kind, items.map((x, i) => (i === idx ? { ...x, visible: !x.visible } : x)), `${label}: ${it.visible ? (es ? "oculta" : "hidden") : (es ? "visible" : "visible")}`)}
          >
            {it.visible ? (es ? "Visible" : "Visible") : (es ? "Oculta" : "Hidden")}
          </button>
        </Tip>
        <span className="adm-move">
          <button
            type="button"
            className="adm-btn adm-icon"
            disabled={idx === 0}
            aria-label={es ? `Subir ${label}` : `Move ${label} up`}
            title={es ? "Subir" : "Move up"}
            onClick={() => void commit(kind, moveItem(items, idx, idx - 1), es ? `${label} subió a la posición ${idx}` : `${label} moved to position ${idx}`)}
          >
            ↑
          </button>
          <button
            type="button"
            className="adm-btn adm-icon"
            disabled={idx === items.length - 1}
            aria-label={es ? `Bajar ${label}` : `Move ${label} down`}
            title={es ? "Bajar" : "Move down"}
            onClick={() => void commit(kind, moveItem(items, idx, idx + 1), es ? `${label} bajó a la posición ${idx + 2}` : `${label} moved to position ${idx + 2}`)}
          >
            ↓
          </button>
        </span>
      </li>
    );
  };

  return (
    <div className="adm-backdrop" data-inline-editor="skip" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-panel" role="dialog" aria-modal="true" aria-label={es ? "Personalizar el sitio" : "Customize the site"} tabIndex={-1} ref={dialogRef}>
        <header className="adm-head">
          <h2 className="adm-title">{es ? "Personalizar" : "Customize"}</h2>
          <button type="button" className="adm-btn adm-icon" aria-label={es ? "Cerrar" : "Close"} title={es ? "Cerrar" : "Close"} onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="adm-tabs" role="tablist" aria-label={es ? "Qué personalizar" : "What to customize"}>
          {tabs.map(([k, text, tip]) => (
            <Tip text={tip} key={k}>
              <button type="button" role="tab" aria-selected={tab === k} className="adm-tab" onClick={() => setTab(k)}>
                {text}
              </button>
            </Tip>
          ))}
        </div>
        <div className="adm-body" role="tabpanel">
          {tab === "sections" ? (
            <div className="adm-stack">
              <div className="adm-line">
                <Tip text={es ? "Con esto activado podés tocar los textos de cada página para cambiarlos" : "When on, you can tap the text on each page to change it"}>
                  <button type="button" role="switch" aria-checked={edit.on} className="adm-switch" onClick={() => edit.set(!edit.on)}>
                    {es ? "Editar textos en la página" : "Edit text on the page"}: {edit.on ? (es ? "sí" : "on") : (es ? "no" : "off")}
                  </button>
                </Tip>
              </div>
              <ul className="adm-list" aria-label={es ? "Secciones" : "Sections"}>
                {sections.map((s, i) => row("sections", sections, i, sectionLabel(s.key), href(sectionHref[s.key] ?? "/")))}
              </ul>
            </div>
          ) : null}
          {tab === "projects" ? (
            <div className="adm-stack">
              {projects.length === 0 ? <p className="adm-empty">{es ? "Todavía no hay proyectos." : "No projects yet."}</p> : (
                <ul className="adm-list" aria-label={es ? "Proyectos" : "Projects"}>
                  {projects.map((p, i) => row("projects", projects, i, projectLabel(p.key), href(`/proyectos/${p.key}`)))}
                </ul>
              )}
              <div className="adm-line">
                <Tip text={es ? "Ahí podés agregar proyectos nuevos y editar todos sus datos" : "Add new projects there and edit all their details"}>
                  <Link href={href("/proyectos")} className="adm-btn" onClick={goEdit}>
                    {es ? "Agregar o editar proyectos" : "Add or edit projects"}
                  </Link>
                </Tip>
              </div>
            </div>
          ) : null}
          <AdminSettings tab={tab === "appearance" || tab === "info" ? tab : null} />
          {error ? <p className="adm-msg is-bad" role="alert">{error}</p> : null}
        </div>
        <span className="sr-only" aria-live="polite">{live}</span>
      </div>
    </div>
  );
}
