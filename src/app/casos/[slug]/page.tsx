import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoVideo } from "@/components/demo-video";
import { JsonLd } from "@/components/json-ld";
import { CASE_STUDIES, caseBySlug } from "@/content/showcase";
import { SERVICE_PAGES } from "@/content/service-pages";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/prefs";
import { localizePath, pathPair } from "@/lib/routes";
import { breadcrumbLd, caseStudyLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import { thumb } from "@/lib/thumbs";
import { casosUi } from "../copy";
import "../../home.css";
import "../../showcase.css";

type Props = { params: Promise<{ slug: string }> };

/** Date the demo clips were recorded (VideoObject.uploadDate). */
const DEMO_DATE = "2026-11-21";

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = caseBySlug(slug);
  if (!cs) return {};
  const locale = await getRequestLocale();
  const c = cs.copy[locale];
  const s = await getSiteSettings();
  const title = `${c.name}: ${locale === "es" ? "caso real" : "case study"} | Lulox`;
  return buildPageMetadata(
    locale,
    pathPair(`/casos/${cs.slug}`),
    { title, description: c.tagline },
    { fullTitle: title, images: [new URL(`/og/case-${cs.slug}-${locale}.jpg`, s.url).href] },
  );
}

/** /casos/<slug> (/en/case-studies/<slug>): demo clip, answer-first summary, problem, solution, stack. */
export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const cs = caseBySlug(slug);
  if (!cs) notFound();
  const [locale, settings] = await Promise.all([getRequestLocale(), getSiteSettings()]);
  const c = cs.copy[locale];
  const u = casosUi[locale];
  const href = (p: string) => localizePath(locale, p);
  const esPath = `/casos/${cs.slug}`;
  const services = SERVICE_PAGES.filter((p) => p.related.includes(cs.slug));
  const graph = [
    ...caseStudyLd(settings, locale, {
      name: c.name,
      description: c.summary,
      esPath,
      media: cs.media,
      stack: cs.stack,
      live: cs.live,
      github: cs.github,
      icon: cs.icon,
      uploadDate: DEMO_DATE,
    }),
    breadcrumbLd(settings, locale, [
      { name: settings.name, esPath: "/" },
      { name: u.title, esPath: "/casos" },
      { name: c.name, esPath },
    ]),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <main className="dp" style={{ ["--hm-accent" as string]: cs.accent }}>
        <nav className="dp-crumbs" aria-label="Breadcrumb">
          <Link href={href("/")}>{u.home}</Link>
          <span aria-hidden>/</span>
          <Link href={href("/casos")}>{u.title}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{c.name}</span>
        </nav>

        <header className="dp-head">
          <p className="dp-kicker">{u.kicker}</p>
          <h1 className="dp-h1 has-icon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb(cs.icon)} alt="" width={40} height={40} className="cs-icon is-big" />
            {c.name}
          </h1>
          <p className="hm-lead">{c.tagline}</p>
        </header>

        <figure className="dp-video" style={{ margin: 0 }}>
          <DemoVideo name={cs.media} label={c.mediaAlt} />
          <figcaption className="hm-note" style={{ margin: ".5rem .25rem 0" }}>{u.demoNote}</figcaption>
        </figure>

        <section className="dp-section" aria-labelledby="dp-what">
          <h2 id="dp-what" className="dp-h2">{u.whatIs(c.name)}</h2>
          <p className="dp-answer" data-reveal>{c.summary}</p>
        </section>

        <section className="dp-section" aria-labelledby="dp-problem">
          <h2 id="dp-problem" className="dp-h2">{u.problem}</h2>
          <p className="hm-field" data-reveal>{c.problem}</p>
        </section>

        <section className="dp-section" aria-labelledby="dp-solution">
          <h2 id="dp-solution" className="dp-h2">{u.solution}</h2>
          <ul className="dp-list">
            {c.solution.map((x) => (
              <li key={x} data-reveal>{x}</li>
            ))}
          </ul>
        </section>

        <dl className="dp-meta" data-reveal>
          <div>
            <dt>{u.forWhom}</dt>
            <dd>{c.forWhom}</dd>
          </div>
          <div>
            <dt>{u.status}</dt>
            <dd>{c.status}</dd>
          </div>
          <div>
            <dt>{u.stack}</dt>
            <dd className="dp-tags">
              {cs.stack.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </dd>
          </div>
        </dl>

        {cs.live || cs.github || cs.projectId ? (
          <div className="cs-links">
            {cs.live ? <a href={cs.live} target="_blank" rel="noopener noreferrer" className="hm-more">{u.open} ↗</a> : null}
            {cs.github ? <a href={cs.github} target="_blank" rel="noopener noreferrer" className="hm-more">{u.code} ↗</a> : null}
            {cs.projectId ? <Link href={href(`/proyectos/${cs.projectId}`)} className="hm-more is-dim">{u.project} ▸</Link> : null}
          </div>
        ) : null}

        <section className="dp-cta" data-reveal>
          <p>{u.cta}</p>
          <Link href={href("/contratar")} className="hm-cta-link">{u.ctaBtn}</Link>
          {services.length ? (
            <div className="dp-related">
              {services.map((p) => (
                <Link key={p.slug} href={href(`/servicios/${p.slug}`)} className="hm-nav-link">{p.copy[locale].label}</Link>
              ))}
            </div>
          ) : null}
        </section>

        <nav className="dp-section" aria-labelledby="dp-others">
          <h2 id="dp-others" className="dp-h2">{u.others}</h2>
          <div className="dp-related">
            {CASE_STUDIES.filter((x) => x.slug !== cs.slug).map((x) => (
              <Link key={x.slug} href={href(`/casos/${x.slug}`)} className="hm-nav-link">{x.copy[locale].name}</Link>
            ))}
          </div>
        </nav>
      </main>
    </>
  );
}
