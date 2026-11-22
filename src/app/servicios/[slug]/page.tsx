import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoVideo } from "@/components/demo-video";
import { JsonLd } from "@/components/json-ld";
import { SERVICE_PAGES, servicePageBySlug } from "@/content/service-pages";
import { caseBySlug } from "@/content/showcase";
import { servicesCopy } from "@/content/services-copy";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/prefs";
import { localizePath, pathPair } from "@/lib/routes";
import { breadcrumbLd, faqLd, serviceOfferLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import { thumb } from "@/lib/thumbs";
import "../../home.css";
import "../../showcase.css";

type Props = { params: Promise<{ slug: string }> };

const ui = {
  es: { home: "Inicio", kicker: "Servicio", related: "Casos reales relacionados", other: "Otros servicios", cta: "Contame qué se hace a mano hoy y vemos cómo automatizarlo.", ctaBtn: "Contratar", faq: "Preguntas frecuentes", caseLink: "Ver el caso" },
  en: { home: "Home", kicker: "Service", related: "Related real projects", other: "Other services", cta: "Tell me what is done by hand today and we'll see how to automate it.", ctaBtn: "Hire me", faq: "Frequently asked questions", caseLink: "Read the case" },
} as const;

const ogFor = (slug: string, locale: string) => `/og/svc-${slug}-${locale}.jpg`;

export function generateStaticParams() {
  return SERVICE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = servicePageBySlug(slug);
  if (!page) return {};
  const locale = await getRequestLocale();
  const c = page.copy[locale];
  const s = await getSiteSettings();
  return buildPageMetadata(
    locale,
    pathPair(`/servicios/${page.slug}`),
    { title: c.metaTitle, description: c.metaDescription },
    { fullTitle: c.metaTitle, images: [new URL(ogFor(page.slug, locale), s.url).href] },
  );
}

/** /servicios/<slug> (/en/services/<slug>): one search intent, answer first, real related cases, FAQ, CTA. */
export default async function ServiceIntentPage({ params }: Props) {
  const { slug } = await params;
  const page = servicePageBySlug(slug);
  if (!page) notFound();
  const [locale, settings] = await Promise.all([getRequestLocale(), getSiteSettings()]);
  const c = page.copy[locale];
  const u = ui[locale];
  const href = (p: string) => localizePath(locale, p);
  const esPath = `/servicios/${page.slug}`;
  const related = page.related.flatMap((r) => {
    const cs = caseBySlug(r);
    return cs ? [cs] : [];
  });
  const graph = [
    serviceOfferLd(settings, locale, { name: c.h1, description: c.metaDescription, esPath, serviceType: c.label, image: ogFor(page.slug, locale) }),
    faqLd([{ q: c.question, a: c.answer }, ...c.faq]),
    breadcrumbLd(settings, locale, [
      { name: settings.name, esPath: "/" },
      { name: servicesCopy[locale].title, esPath: "/servicios" },
      { name: c.label, esPath },
    ]),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <main className="dp">
        <nav className="dp-crumbs" aria-label="Breadcrumb">
          <Link href={href("/")}>{u.home}</Link>
          <span aria-hidden>/</span>
          <Link href={href("/servicios")}>{servicesCopy[locale].title}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{c.label}</span>
        </nav>

        <header className="dp-head">
          <p className="dp-kicker">{u.kicker}</p>
          <h1 className="dp-h1">{c.h1}</h1>
        </header>

        <section className="dp-section" aria-labelledby="dp-q">
          <h2 id="dp-q" className="dp-h2">{c.question}</h2>
          <p className="dp-answer" data-reveal>{c.answer}</p>
          <Link href={href("/contratar")} className="hm-cta-link" style={{ maxWidth: "18rem" }}>{u.ctaBtn}</Link>
        </section>

        <section className="dp-section" aria-labelledby="dp-cases">
          <h2 id="dp-cases" className="dp-h2">{c.casesTitle}</h2>
          <ul className="dp-list is-2">
            {c.cases.map((it) => (
              <li key={it.title} data-reveal>
                <strong>{it.title}.</strong> {it.body}
              </li>
            ))}
          </ul>
        </section>

        {related.length ? (
          <section className="dp-section" aria-labelledby="dp-related">
            <h2 id="dp-related" className="dp-h2">{u.related}</h2>
            <ul className="cs-grid">
              {related.map((cs) => {
                const cc = cs.copy[locale];
                return (
                  <li key={cs.slug} className="cs-card" data-reveal style={{ ["--hm-accent" as string]: cs.accent }}>
                    <Link href={href(`/casos/${cs.slug}`)} className="cs-media" aria-label={`${cc.name}: ${u.caseLink}`}>
                      <DemoVideo name={cs.media} label={cc.mediaAlt} />
                    </Link>
                    <div className="cs-body">
                      <h3 className="cs-title">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb(cs.icon)} alt="" width={28} height={28} loading="lazy" decoding="async" className="cs-icon" />
                        {cc.name}
                      </h3>
                      <p className="cs-tagline">{cc.tagline}</p>
                      <Link href={href(`/casos/${cs.slug}`)} className="hm-more">{u.caseLink} ▸</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="dp-section" aria-labelledby="dp-how">
          <h2 id="dp-how" className="dp-h2">{c.howTitle}</h2>
          <ol className="dp-steps">
            {c.how.map((step) => (
              <li key={step} data-reveal>{step}</li>
            ))}
          </ol>
        </section>

        <section className="dp-section" aria-labelledby="dp-faq">
          <h2 id="dp-faq" className="dp-h2">{u.faq}</h2>
          {c.faq.map((f) => (
            <div key={f.q} className="dp-faq" data-reveal>
              <h3 className="dp-faq-q">{f.q}</h3>
              <p className="dp-faq-a">{f.a}</p>
            </div>
          ))}
        </section>

        <section className="dp-cta" data-reveal>
          <p>{u.cta}</p>
          <Link href={href("/contratar")} className="hm-cta-link">{u.ctaBtn}</Link>
        </section>

        <nav className="dp-section" aria-labelledby="dp-other">
          <h2 id="dp-other" className="dp-h2">{u.other}</h2>
          <ul className="sv-chips">
            {SERVICE_PAGES.filter((p) => p.slug !== page.slug).map((p) => (
              <li key={p.slug}>
                <Link href={href(`/servicios/${p.slug}`)} className="sv-chip">
                  <span>{p.copy[locale].label}</span>
                  <span aria-hidden>▸</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </>
  );
}
