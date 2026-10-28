"use client";

import { CopyMarkdown } from "@/components/copy-markdown";
import { CpRow } from "@/components/cp-row";
import { GitHubIcon } from "@/components/icons/social";
import { PageShell } from "@/components/page-shell";
import type { PortfolioProject, ProjectStatus } from "@/lib/projects";
import { useLocale } from "@/i18n/locale-provider";
import { useEditMode } from "@/components/admin-context";
import { ProjectText, saveProject } from "@/components/project-text";
import { CopyText } from "@/components/copy-text";
import { ProjectDetailsEdit } from "@/components/project-details-edit";
import { ProjectPet } from "@/components/mochi-pet";

const statusClass: Record<ProjectStatus, string> = {
  live: "project-status-live",
  disabled: "project-status-disabled",
  archive: "project-status-archive",
};

/** Project detail, rendered on the server with D1 overrides already merged. */
export function ProjectDetail({ project }: { project: PortfolioProject }) {
  const { t, locale } = useLocale();
  const editOn = useEditMode();

  const copy = project.copy[locale] ?? project.copy.es;
  const statusLabel =
    project.status === "live"
      ? t.projects.statusLive
      : project.status === "disabled"
        ? t.projects.statusDisabled
        : t.projects.statusArchive;

  return (
    <PageShell
      reading
      title={copy.title}
      hideTitle
      backHref="/proyectos"
      backLabel={t.projects.backToProjects}
      footerHref="/proyectos"
      footerLabel={t.projects.backToProjectsCta}
    >
      {project.widget === "pet" ? <ProjectPet /> : null}
      <div className="space-y-6">
        <div
          className="cp-panel project-detail-hero"
          style={{ ["--cp-accent" as string]: "var(--section-projects)" }}
        >
          <span className="cp-nav-frame" aria-hidden>
            <span className="cp-nav-corner cp-nav-corner-tl" />
            <span className="cp-nav-corner cp-nav-corner-br" />
          </span>
          <div className="cp-panel-inner flex items-center gap-4 sm:gap-5">
            {project.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.icon} alt="" width={88} height={88} className="project-detail-icon shrink-0" />
            ) : null}
            <div className="min-w-0">
              <CopyText
                as="p"
                className="cp-headline text-[1.05rem] sm:text-[1.2rem]"
                value={copy.title}
                label={t.blog.fieldTitle}
                onSave={(v) =>
                  saveProject(project.id, (p) => {
                    const L = (locale === "en" ? "en" : "es") as "es" | "en";
                    p.copy[L] = { ...p.copy[L], title: v };
                  })
                }
              />
              {editOn ? (
                <ProjectText project={project} field="body" className="mt-1.5" pClass="cp-prose text-[0.9rem]" />
              ) : (
                <CopyMarkdown text={copy.body} className="mt-1.5" pClass="cp-prose text-[0.9rem]" />
              )}
              <span
                className={`project-status-pill mt-3 ${statusClass[project.status]}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          className="cp-panel"
          style={{ ["--cp-accent" as string]: "var(--section-about)" }}
        >
          <span className="cp-nav-frame" aria-hidden>
            <span className="cp-nav-corner cp-nav-corner-tl" />
            <span className="cp-nav-corner cp-nav-corner-br" />
          </span>
          <div className="cp-panel-inner space-y-3">
            {editOn ? (
              <ProjectText project={project} field="paragraphs" />
            ) : (
              copy.paragraphs.map((p) => <CopyMarkdown key={p.slice(0, 48)} text={p} />)
            )}
          </div>
        </div>

        {editOn ? (
          <ProjectDetailsEdit project={project} />
        ) : (
        <dl className="project-meta">
          <div className="project-meta-row">
            <dt>{t.projects.metaTeam}</dt>
            <dd className="project-team">
              {project.team.map((member, i) => (
                <span key={member.name} className="project-team-item">
                  {i > 0 ? <span className="project-team-sep">·</span> : null}
                  {member.href ? (
                    <a
                      href={member.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cp-prose-link"
                    >
                      {member.name}
                    </a>
                  ) : (
                    member.name
                  )}
                </span>
              ))}
            </dd>
          </div>
          <div className="project-meta-row">
            <dt>{t.projects.metaAwards}</dt>
            <dd>{copy.awards || t.projects.noAwards}</dd>
          </div>
          <div className="project-meta-row">
            <dt>{t.projects.metaStatus}</dt>
            <dd>
              <span className={`project-status-pill ${statusClass[project.status]}`}>
                {statusLabel}
              </span>
            </dd>
          </div>
          {project.status === "disabled" && project.disabledReason ? (
            <div className="project-meta-row">
              <dt>{t.projects.metaDisabledReason}</dt>
              <dd className="cp-prose text-[0.9rem]">
                {locale === "en"
                  ? project.disabledReason.en
                  : project.disabledReason.es}
              </dd>
            </div>
          ) : null}
        </dl>
        )}

        <div className="!mt-4 space-y-2 sm:!mt-6">
          {project.liveUrl ? (
            <CpRow
              href={project.liveUrl}
              label={t.projects.openLive}
              accent="var(--section-projects)"
            />
          ) : null}
          {project.github ? (
            <CpRow
              href={project.github}
              label={t.projects.openGithub}
              accent="var(--foreground)"
              Icon={GitHubIcon}
              iconClass="text-foreground"
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
