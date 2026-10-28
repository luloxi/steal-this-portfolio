"use client";

import { CopyMarkdown } from "@/components/copy-markdown";
import Link from "next/link";
import { CpRow } from "@/components/cp-row";
import { GitHubIcon } from "@/components/icons/social";
import { ProjectsAdmin } from "@/components/projects-admin";
import { useEditMode } from "@/components/admin-context";
import { useSiteSettings } from "@/components/site-settings-context";
import type { PortfolioProject } from "@/lib/projects";
import { useLocale } from "@/i18n/locale-provider";
import { useSiteOrder } from "@/components/site-order-context";
import { orderRecords } from "@/lib/site-sections";
import { useHoloTilt } from "@/lib/use-holo-tilt";
import type { ComponentProps } from "react";

/** Project card with the holographic tilt + sheen. */
function HoloLink({ className, children, ...rest }: ComponentProps<typeof Link>) {
  const ref = useHoloTilt<HTMLAnchorElement>();
  return (
    <Link ref={ref} className={`${className ?? ""} holo`} {...rest}>
      {children}
      <span className="holo-sheen" aria-hidden />
    </Link>
  );
}

const pastAccents = [
  "var(--section-contact)",
  "var(--section-blog)",
  "var(--section-projects)",
];

export function ProjectsAccordion({ projects: all }: { projects: PortfolioProject[] }) {
  const { t, locale, href } = useLocale();
  const settings = useSiteSettings();
  const editOn = useEditMode();
  // The server already dropped hidden projects for visitors; this applies live reorders/hides from the admin strip.
  const order = useSiteOrder();
  const projects = order.projects.length ? orderRecords(all, order.projects, order.showHidden) : all;
  const hidden = new Set(order.projects.filter((p) => !p.visible).map((p) => p.key));
  return (
    <div className="space-y-10">
      <section>
        <h2 className="cp-heading">{t.projects.githubHeading}</h2>
        {settings.githubHref ? (
          <CpRow
            href={settings.githubHref}
            label={settings.githubHandle || settings.githubHref.replace(/^https?:\/\/(www\.)?/, "")}
            accent="var(--foreground)"
            Icon={GitHubIcon}
            iconClass="text-foreground"
            iconSize="lg"
          />
        ) : null}
        {editOn ? <ProjectsAdmin projects={all} /> : null}
        {projects.length === 0 ? <p className="cp-prose mt-3 text-muted">{t.projects.empty}</p> : null}
        <ul className="cp-list mt-3">
          {projects.map((project, i) => {
            const copy = project.copy[locale] ?? project.copy.es;
            const accent = pastAccents[i % pastAccents.length];
            return (
              <li key={project.id}>
                <HoloLink
                  href={href(`/proyectos/${project.id}`)}
                  className={`cp-row group${hidden.has(project.id) ? " is-section-hidden" : ""}`}
                  data-hidden={hidden.has(project.id) ? "true" : undefined}
                  style={{ ["--cp-accent" as string]: accent }}
                >
                  <span className="cp-nav-frame" aria-hidden>
                    <span className="cp-nav-corner cp-nav-corner-tl" />
                    <span className="cp-nav-corner cp-nav-corner-br" />
                    <span className="cp-nav-scan" />
                  </span>

                  {project.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.icon}
                      alt=""
                      width={72}
                      height={72}
                      className="cp-row-icon project-icon shrink-0"
                    />
                  ) : null}

                  <span className="cp-row-body min-w-0">
                    <span className="cp-row-label">{copy.title}</span>
                    <span className="cp-row-detail"><CopyMarkdown text={copy.body} inline pClass="" /></span>
                  </span>

                  <span className="cp-nav-chevron cp-row-chevron" aria-hidden>
                    ▸
                  </span>
                  <span className="cp-nav-bar cp-row-bar" aria-hidden />
                </HoloLink>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
