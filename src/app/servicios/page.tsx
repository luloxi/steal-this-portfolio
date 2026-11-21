import Link from "next/link";
import { HireButton } from "@/components/hire-button";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { HOME_PROJECT_IDS } from "@/content/home-copy";
import { servicesCopy } from "@/content/services-copy";
import { getRequestLocale } from "@/lib/prefs";
import { getProjects } from "@/lib/projects-db";
import { localizePath } from "@/lib/routes";
import { breadcrumbLd, serviceLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import { thumb } from "@/lib/thumbs";
import "../home.css";

const accents = ["var(--section-contact)", "var(--section-blog)", "var(--section-projects)"];

/** /servicios (/en/services): concrete use cases (marked as examples), custom work, process. */
export default async function ServicesPage() {
  const [locale, all, settings] = await Promise.all([getRequestLocale(), getProjects(), getSiteSettings()]);
  const c = servicesCopy[locale];
  const projects = HOME_PROJECT_IDS.flatMap((id) => {
    const p = all.find((x) => x.id === id && x.visible);
    return p ? [{ id: p.id, icon: p.icon, ...(p.copy[locale] ?? p.copy.es) }] : [];
  });
  const graph = [
    serviceLd(settings, locale, { name: c.title, description: c.meta.description, offers: c.offers }),
    breadcrumbLd(settings, locale, [
      { name: settings.name, esPath: "/" },
      { name: c.title, esPath: "/servicios" },
    ]),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <PageShell title={c.title}>
        <div className="hm-page">
          <p className="hm-lead">{c.intro}</p>
          <div className="hm-cta"><HireButton /></div>

          <section className="hm-section" aria-labelledby="sv-cases">
            <h2 id="sv-cases" className="hm-h2">{c.useCases.title}</h2>
            <p className="hm-note">{c.useCases.note}</p>
            <ul className="hm-cards hm-cards-2">
              {c.useCases.items.map((item, i) => (
                <li key={item.title} className="hm-card" style={{ ["--hm-accent" as string]: accents[i % accents.length] }}>
                  <h3 className="hm-card-title">{item.title}</h3>
                  <p className="hm-card-body">{item.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="hm-section" aria-labelledby="sv-custom">
            <h2 id="sv-custom" className="hm-h2">{c.custom.title}</h2>
            <p className="hm-field">{c.custom.body}</p>
            {projects.length ? (
              <ul className="hm-projects" aria-label={c.custom.projectsLabel}>
                {projects.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={localizePath(locale, `/proyectos/${p.id}`)}
                      className="cp-row group hm-project"
                      style={{ ["--cp-accent" as string]: accents[i % accents.length] }}
                    >
                      <span className="cp-nav-frame" aria-hidden>
                        <span className="cp-nav-corner cp-nav-corner-tl" />
                        <span className="cp-nav-corner cp-nav-corner-br" />
                      </span>
                      {p.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb(p.icon)} alt="" width={48} height={48} loading="lazy" className="cp-row-icon project-icon hm-project-icon" />
                      ) : null}
                      <span className="cp-row-body min-w-0">
                        <span className="cp-row-label">{p.title}</span>
                        <span className="cp-row-detail">{p.body}</span>
                      </span>
                      <span className="cp-nav-chevron cp-row-chevron" aria-hidden>▸</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="hm-section" aria-labelledby="sv-n8n">
            <h2 id="sv-n8n" className="hm-h2">{c.n8n.title}</h2>
            <p className="hm-text">{c.n8n.body}</p>
          </section>

          <section className="hm-section" aria-labelledby="sv-stack">
            <h2 id="sv-stack" className="hm-h2">{c.stack.title}</h2>
            <p className="hm-text">{c.stack.body}</p>
          </section>

          <section className="hm-section" aria-labelledby="sv-process">
            <h2 id="sv-process" className="hm-h2">{c.process.title}</h2>
            <ol className="hm-steps hm-steps-stack">
              {c.process.steps.map((step, i) => (
                <li key={step} className="hm-step">
                  <span className="hm-step-n" aria-hidden>{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="hm-closing">
            <p>{c.closing}</p>
            <div className="hm-cta"><HireButton /></div>
          </section>
        </div>
      </PageShell>
    </>
  );
}
