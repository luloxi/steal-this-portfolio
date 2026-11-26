import Link from "next/link";
import { ContactTrigger } from "@/components/contact-modal";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { HOME_PROJECT_IDS } from "@/content/home-copy";
import { SERVICE_SECTION_IDS, servicesCopy } from "@/content/services-copy";
import { getRequestLocale } from "@/lib/prefs";
import { getProjects } from "@/lib/projects-db";
import { localizePath } from "@/lib/routes";
import { breadcrumbLd, serviceLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import { thumb } from "@/lib/thumbs";
import "../home.css";
import "../showcase.css";
import "../landing.css";
import "./servicios.css";

const accents = ["var(--joy-1)", "var(--joy-2)", "var(--joy-3)", "var(--joy-4)", "var(--joy-5)"];

/** /servicios (/en/services): «Hecho para vos». One page; the old /servicios/<slug> pages 301 to its sections. */
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
        <div className="ln sv">
          <p className="sv-intro">{c.intro}</p>
          <ContactTrigger className="hm-cta-link ln-btn" data-testid="services-cta">{c.cta}</ContactTrigger>

          <section className="sv-block" aria-labelledby="sv-offer">
            <h2 id="sv-offer" className="sv-h2">{c.offer.title}</h2>
            <ul className="sv-offer">
              {c.offer.items.map((it, i) => (
                <li key={it.title} id={SERVICE_SECTION_IDS[i]} className="sv-card">
                  <h3 className="sv-card-title">{it.title}</h3>
                  <p className="sv-card-body">{it.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="sv-block" aria-labelledby="sv-cases">
            <h2 id="sv-cases" className="sv-h2">{c.useCases.title}</h2>
            <p className="ln-note">{c.useCases.note}</p>
            <ul className="sv-cases">
              {c.useCases.items.map((it) => (
                <li key={it.title}>
                  <strong>{it.title}.</strong> {it.body}
                </li>
              ))}
            </ul>
          </section>

          <section className="sv-block" aria-labelledby="sv-custom">
            <h2 id="sv-custom" className="sv-h2">{c.custom.title}</h2>
            <p className="sv-text">{c.custom.body}</p>
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

          <section className="sv-block" aria-labelledby="sv-process">
            <h2 id="sv-process" className="sv-h2">{c.process.title}</h2>
            <ol className="ln-steps">
              {c.process.steps.map((step, i) => (
                <li key={step} className="ln-step">
                  <span className="ln-step-n" aria-hidden>{i + 1}</span>
                  <p className="ln-step-body">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <p className="sv-recipes">
            {c.recipes.body} <Link href={localizePath(locale, "/recetas")} className="ln-recipe-link">{c.recipes.link} ▸</Link>
          </p>

          <section className="rc-cta sv-closing" aria-labelledby="sv-closing">
            <h2 id="sv-closing" className="sv-closing-title">{c.closing.title}</h2>
            <ContactTrigger className="hm-cta-link ln-btn" data-testid="services-closing-cta">{c.closing.cta}</ContactTrigger>
          </section>
        </div>
      </PageShell>
    </>
  );
}
