import type { Metadata } from "next";
import Link from "next/link";
import { DemoVideo } from "@/components/demo-video";
import { JsonLd } from "@/components/json-ld";
import { CASE_STUDIES } from "@/content/showcase";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/prefs";
import { localizePath, pathPair } from "@/lib/routes";
import { breadcrumbLd, personId } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import { thumb } from "@/lib/thumbs";
import { casosUi } from "./copy";
import "../home.css";
import "../showcase.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const u = casosUi[locale];
  const s = await getSiteSettings();
  return buildPageMetadata(
    locale,
    pathPair("/casos"),
    { title: u.metaTitle, description: u.metaDescription },
    { fullTitle: u.metaTitle, images: [new URL(`/og/case-flota-de-bots-${locale}.jpg`, s.url).href] },
  );
}

/** /casos (/en/case-studies): every case study with its demo loop. */
export default async function CasesPage() {
  const [locale, settings] = await Promise.all([getRequestLocale(), getSiteSettings()]);
  const u = casosUi[locale];
  const href = (p: string) => localizePath(locale, p);
  const graph = [
    {
      "@type": "CollectionPage",
      name: u.title,
      description: u.metaDescription,
      url: new URL(href("/casos"), settings.url).href,
      author: { "@id": personId(settings) },
      hasPart: CASE_STUDIES.map((cs) => ({ "@id": `${new URL(href(`/casos/${cs.slug}`), settings.url).href}#software` })),
    },
    breadcrumbLd(settings, locale, [
      { name: settings.name, esPath: "/" },
      { name: u.title, esPath: "/casos" },
    ]),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <main className="dp" style={{ maxWidth: "62rem" }}>
        <nav className="dp-crumbs" aria-label="Breadcrumb">
          <Link href={href("/")}>{u.home}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{u.title}</span>
        </nav>
        <header className="dp-head">
          <h1 className="dp-h1">{u.title}</h1>
          <p className="hm-sublead">{u.lead}</p>
        </header>
        <ul className="cs-grid">
          {CASE_STUDIES.map((cs) => {
            const c = cs.copy[locale];
            return (
              <li key={cs.slug} className="cs-card" data-reveal style={{ ["--hm-accent" as string]: cs.accent }}>
                <Link href={href(`/casos/${cs.slug}`)} className="cs-media" aria-label={`${c.name}: ${u.caseLink}`}>
                  <DemoVideo name={cs.media} label={c.mediaAlt} />
                </Link>
                <div className="cs-body">
                  <h2 className="cs-title">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(cs.icon)} alt="" width={28} height={28} loading="lazy" decoding="async" className="cs-icon" />
                    {c.name}
                  </h2>
                  <p className="cs-tagline">{c.tagline}</p>
                  <p className="cs-for">{c.forWhom}</p>
                  <Link href={href(`/casos/${cs.slug}`)} className="hm-more">{u.caseLink} ▸</Link>
                </div>
              </li>
            );
          })}
        </ul>
        <section className="dp-cta" data-reveal>
          <p>{u.cta}</p>
          <Link href={href("/contratar")} className="hm-cta-link">{u.ctaBtn}</Link>
        </section>
      </main>
    </>
  );
}
