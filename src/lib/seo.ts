/**
 * Structured data (schema.org JSON-LD) for search and answer engines.
 * Pure builders: the page passes settings, copy and projects; nothing is fetched here.
 * Everything described here is also visible on the page (no hidden content).
 */
import type { Locale } from "@/i18n/types";
import type { SiteSettings } from "@/lib/site-settings";
import { localizePath } from "@/lib/routes";

type Json = Record<string, unknown>;

/** Share image per language: "/og-agents-es.jpg" -> "/og-agents-en.jpg" under /en. Other paths pass through. */
export function localizedOgImage(path: string, locale: Locale): string {
  return path.replace(/-(es|en)(\.[a-z]+)$/i, `-${locale}$2`);
}

const abs = (s: SiteSettings, path: string) => new URL(path, s.url).href;

export function personId(s: SiteSettings) {
  return `${s.url}/#person`;
}
export function serviceId(s: SiteSettings) {
  return `${s.url}/#service`;
}

/** Public profile links already shown on the site (footer, contact page). */
/** Where Luciano works from: Buenos Aires, Argentina (no street address, he works remotely). */
export const ADDRESS: Json = { "@type": "PostalAddress", addressLocality: "Buenos Aires", addressRegion: "CABA", addressCountry: "AR" };

/** Remote work for Latin America and the rest of the world. */
export function areaServed(locale: Locale): Json[] {
  return [
    { "@type": "City", name: "Buenos Aires" },
    { "@type": "Country", name: "Argentina" },
    { "@type": "Place", name: locale === "es" ? "Latinoamérica" : "Latin America" },
    { "@type": "Place", name: locale === "es" ? "Todo el mundo (remoto)" : "Worldwide (remote)" },
  ];
}

export function sameAs(s: SiteSettings): string[] {
  const links = [...s.socials.map((x) => x.href), s.githubHref].filter(Boolean);
  return [...new Set(links)];
}

export function personLd(s: SiteSettings, locale: Locale, jobTitle: string, knowsAbout: string[]): Json {
  return {
    "@type": "Person",
    "@id": personId(s),
    name: s.legalName,
    alternateName: s.name,
    url: abs(s, localizePath(locale, "/")),
    image: abs(s, s.heroPhoto),
    jobTitle,
    knowsAbout,
    knowsLanguage: ["es", "en"],
    homeLocation: { "@type": "City", name: "Buenos Aires", address: ADDRESS },
    address: ADDRESS,
    sameAs: sameAs(s),
  };
}

export function websiteLd(s: SiteSettings, locale: Locale, description: string): Json {
  return {
    "@type": "WebSite",
    "@id": `${s.url}/#website`,
    url: s.url,
    name: s.name,
    description,
    inLanguage: locale === "es" ? "es-AR" : "en-US",
    publisher: { "@id": personId(s) },
  };
}

export function serviceLd(
  s: SiteSettings,
  locale: Locale,
  opts: { name: string; description: string; offers: { name: string; description: string }[] },
): Json {
  return {
    "@type": "ProfessionalService",
    "@id": serviceId(s),
    name: opts.name,
    description: opts.description,
    url: abs(s, localizePath(locale, "/servicios")),
    image: abs(s, localizedOgImage(s.ogImage, locale)),
    founder: { "@id": personId(s) },
    provider: { "@id": personId(s) },
    areaServed: areaServed(locale),
    address: ADDRESS,
    availableLanguage: ["es", "en"],
    sameAs: sameAs(s),
    potentialAction: { "@type": "CommunicateAction", target: abs(s, localizePath(locale, "/contacto")) },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: opts.name,
      itemListElement: opts.offers.map((o) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: o.name, description: o.description, provider: { "@id": personId(s) } },
      })),
    },
  };
}

/** One offering page (/servicios/<slug>): a Service provided by the ProfessionalService and the Person. */
export function serviceOfferLd(
  s: SiteSettings,
  locale: Locale,
  opts: { name: string; description: string; esPath: string; serviceType: string; image?: string },
): Json {
  const url = abs(s, localizePath(locale, opts.esPath));
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: opts.name,
    serviceType: opts.serviceType,
    description: opts.description,
    url,
    ...(opts.image ? { image: abs(s, opts.image) } : {}),
    provider: [{ "@id": personId(s) }, { "@id": serviceId(s) }],
    areaServed: areaServed(locale),
    availableChannel: { "@type": "ServiceChannel", serviceUrl: abs(s, localizePath(locale, "/contacto")), availableLanguage: ["es", "en"] },
    inLanguage: locale === "es" ? "es-AR" : "en-US",
  };
}

export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

export function projectsLd(s: SiteSettings, locale: Locale, projects: { id: string; title: string; body: string; icon: string }[]): Json {
  return {
    "@type": "ItemList",
    name: locale === "es" ? "Proyectos" : "Projects",
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: p.title,
        description: p.body,
        applicationCategory: "BusinessApplication",
        url: abs(s, localizePath(locale, `/proyectos/${p.id}`)),
        ...(p.icon ? { image: abs(s, p.icon) } : {}),
        author: { "@id": personId(s) },
      },
    })),
  };
}

export function breadcrumbLd(s: SiteSettings, locale: Locale, items: { name: string; esPath: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(s, localizePath(locale, it.esPath)),
    })),
  };
}

/** One script body for a page: {"@context", "@graph": [...]}; "<" escaped so it can't close the tag. */
export function ldScript(graph: Json[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}
