"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ToolbarButton } from "@/components/md-wysiwyg";
import { saveProject } from "@/components/project-text";
import type { PortfolioProject, ProjectStatus, TeamMember } from "@/lib/projects";
import { useLocale } from "@/i18n/locale-provider";

/** "Name (https://url) · Name2" <-> team members. */
export function teamToText(team: TeamMember[]): string {
  return team.map((m) => (m.href ? `${m.name} (${m.href})` : m.name)).join(" · ");
}
export function textToTeam(text: string): TeamMember[] {
  return text
    .split(/\s*[·,]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(.*?)\s*\((\S+)\)$/);
      return m ? { name: m[1].trim(), href: m[2] } : { name: part };
    });
}

type Draft = { team: string; awards: string; status: ProjectStatus; reason: string; liveUrl: string; github: string; icon: string };

const statusClass: Record<ProjectStatus, string> = {
  live: "project-status-live",
  disabled: "project-status-disabled",
  archive: "project-status-archive",
};

/**
 * Edit mode for the project meta block: same layout as the published one, with
 * the values editable in place. Saves the current locale's text (awards,
 * disabled reason) plus the shared fields through /api/projects.
 */
export function ProjectDetailsEdit({ project }: { project: PortfolioProject }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const es = locale === "es";
  const L = (locale === "en" ? "en" : "es") as "es" | "en";
  const initial: Draft = {
    team: teamToText(project.team),
    awards: project.copy[L]?.awards ?? "",
    status: project.status,
    reason: project.disabledReason?.[L] ?? "",
    liveUrl: project.liveUrl ?? "",
    github: project.github ?? "",
    icon: project.icon ?? "",
  };
  const [d, setD] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = (Object.keys(initial) as (keyof Draft)[]).some((k) => d[k] !== initial[k]);
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  const confirm = async () => {
    setSaving(true);
    setError("");
    const err = await saveProject(project.id, (p) => {
      p.team = textToTeam(d.team);
      p.copy[L] = { ...p.copy[L], awards: d.awards.trim() };
      p.status = d.status;
      p.disabledReason = { ...(p.disabledReason ?? { es: "", en: "" }), [L]: d.reason.trim() };
      p.liveUrl = d.liveUrl.trim();
      p.github = d.github.trim();
      p.icon = d.icon.trim();
    });
    setSaving(false);
    if (err) setError(err === "session" ? (es ? "Sesión expirada" : "Session expired") : (es ? `No se pudo guardar (${err})` : `Couldn't save (${err})`));
    else router.refresh();
  };

  const statusLabel = (s: ProjectStatus) => (s === "live" ? t.projects.statusLive : s === "disabled" ? t.projects.statusDisabled : t.projects.statusArchive);

  return (
    <>
      <dl className="project-meta">
        <div className="project-meta-row">
          <dt>{t.projects.metaTeam}</dt>
          <dd className="project-team">
            <input className="ie-field" value={d.team} onChange={set("team")} aria-label={t.projects.metaTeam} title={es ? "Nombre (link) · Nombre" : "Name (link) · Name"} />
          </dd>
        </div>
        <div className="project-meta-row">
          <dt>{t.projects.metaAwards}</dt>
          <dd>
            <input className="ie-field" value={d.awards} onChange={set("awards")} placeholder={t.projects.noAwards} aria-label={t.projects.metaAwards} />
          </dd>
        </div>
        <div className="project-meta-row">
          <dt>{t.projects.metaStatus}</dt>
          <dd>
            <select className={`project-status-pill ie-pill-select ${statusClass[d.status]}`} value={d.status} onChange={set("status")} aria-label={t.projects.metaStatus}>
              {(["live", "disabled", "archive"] as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </dd>
        </div>
        {d.status === "disabled" ? (
          <div className="project-meta-row">
            <dt>{t.projects.metaDisabledReason}</dt>
            <dd className="cp-prose text-[0.9rem]">
              <textarea className="ie-field" rows={3} value={d.reason} onChange={set("reason")} aria-label={t.projects.metaDisabledReason} />
            </dd>
          </div>
        ) : null}
        <div className="project-meta-row">
          <dt>{es ? "Icono" : "Icon"}</dt>
          <dd>
            <input className="ie-field" value={d.icon} onChange={set("icon")} placeholder="/projects/icon.svg" aria-label={es ? "Icono" : "Icon"} />
          </dd>
        </div>
        <div className="project-meta-row">
          <dt>{t.projects.openLive}</dt>
          <dd>
            <input className="ie-field" type="url" value={d.liveUrl} onChange={set("liveUrl")} placeholder="https://" aria-label={t.projects.openLive} />
          </dd>
        </div>
        <div className="project-meta-row">
          <dt>GitHub</dt>
          <dd>
            <input className="ie-field" type="url" value={d.github} onChange={set("github")} placeholder="https://github.com/…" aria-label="GitHub" />
          </dd>
        </div>
      </dl>
      {dirty || error
        ? createPortal(
            <div className="ie-floatbar" role="toolbar" aria-label={es ? "Detalles" : "Details"} data-ie-toolbar="1">
              <span className="ie-tb-status">{es ? "Detalles" : "Details"}</span>
              <ToolbarButton label="✓" className="ie-tb-ok" title={es ? "Confirmar y guardar" : "Confirm and save"} disabled={!dirty || saving} onClick={() => void confirm()} />
              <ToolbarButton label="✕" className="ie-tb-cancel" title={es ? "Cancelar cambios" : "Cancel changes"} disabled={saving} onClick={() => { setD(initial); setError(""); }} />
              {saving ? <span className="ie-tb-status">…</span> : null}
              {error ? <span className="ie-tb-error" role="alert">{error}</span> : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
