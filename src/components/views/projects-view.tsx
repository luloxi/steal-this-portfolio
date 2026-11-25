"use client";

import Link from "next/link";
import { DemoVideo } from "@/components/demo-video";
import { PageShell } from "@/components/page-shell";
import { ProjectsAccordion } from "@/components/projects-accordion";
import { useEditMode } from "@/components/admin-context";
import { useSiteSettings } from "@/components/site-settings-context";
import { PROJECT_MEDIA } from "@/content/project-media";
import type { PortfolioProject } from "@/lib/projects";
import { useLocale } from "@/i18n/locale-provider";
import { thumb } from "@/lib/thumbs";

const accents = ["var(--joy-1)", "var(--joy-2)", "var(--joy-3)", "var(--joy-4)", "var(--joy-5)"];
const copy = {
  es: { lead: "Cosas que armé. Algunas las uso para trabajar; otras son experimentos y hobbies.", more: "Más proyectos", code: "Todo el código en GitHub" },
  en: { lead: "Things I've built. Some I use for work; others are experiments and hobbies.", more: "More projects", code: "All the code on GitHub" },
} as const;

/**
 * /proyectos (/en/projects). Visitors get preview cards (demo loop or a real image) for every
 * visible project, in the D1 order; projects without media show as compact tiles.
 * Edit mode keeps the editable accordion, untouched.
 */
export function ProjectsView({ projects }: { projects: PortfolioProject[] }) {
  const { t, locale, href } = useLocale();
  const editOn = useEditMode();
  const settings = useSiteSettings();
  if (editOn) {
    return (
      <PageShell title={t.projects.title}>
        <ProjectsAccordion projects={projects} />
      </PageShell>
    );
  }
  const c = copy[locale === "en" ? "en" : "es"];
  const shown = projects.filter((p) => p.visible);
  const withMedia = shown.filter((p) => PROJECT_MEDIA[p.id]);
  const rest = shown.filter((p) => !PROJECT_MEDIA[p.id]);
  const text = (p: PortfolioProject) => ({ title: p.copy[locale]?.title || p.copy.es.title, body: p.copy[locale]?.body || p.copy.es.body });
  return (
    <PageShell title={t.projects.title} reading>
      <div className="hm-page pj-page">
        <p className="hm-lead pj-lead">{c.lead}</p>
        <ul className="cs-grid">
          {withMedia.map((p, i) => {
            const media = PROJECT_MEDIA[p.id];
            const alt = media.alt[locale === "en" ? "en" : "es"];
            const path = href(`/proyectos/${p.id}`);
            return (
              <li key={p.id} className="cs-card" data-reveal style={{ ["--hm-accent" as string]: accents[i % accents.length] }}>
                <Link href={path} className="cs-media" aria-label={text(p).title} tabIndex={-1}>
                  {media.kind === "video" ? (
                    <DemoVideo name={media.name} label={alt} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.src} alt={alt} width={960} height={600} loading="lazy" decoding="async" className="demo-video" />
                  )}
                </Link>
                <div className="cs-body">
                  <h2 className="cs-title">
                    {p.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb(p.icon)} alt="" width={28} height={28} loading="lazy" decoding="async" className="cs-icon" />
                    ) : null}
                    <Link href={path} className="cs-title-link">{text(p).title}</Link>
                  </h2>
                  <p className="cs-tagline">{text(p).body}</p>
                </div>
              </li>
            );
          })}
        </ul>
        {rest.length ? (
          <section className="hm-section" aria-labelledby="pj-more">
            <h2 id="pj-more" className="hm-h2">{c.more}</h2>
            <ul className="hm-tiles">
              {rest.map((p, i) => (
                <li key={p.id} data-reveal>
                  <Link href={href(`/proyectos/${p.id}`)} className="hm-tile" style={{ ["--hm-accent" as string]: accents[(i + 2) % accents.length] }}>
                    <span className="hm-tile-logo" aria-hidden>
                      {p.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb(p.icon)} alt="" width={64} height={64} loading="lazy" decoding="async" className="project-icon" />
                      ) : null}
                    </span>
                    <span className="hm-tile-title">{text(p).title}</span>
                    <span className="hm-tile-body">{text(p).body}</span>
                    <span className="hm-tile-go" aria-hidden>▸</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {settings.githubHref ? (
          <a href={settings.githubHref} target="_blank" rel="noopener noreferrer" className="hm-more">{c.code} ↗</a>
        ) : null}
      </div>
    </PageShell>
  );
}
