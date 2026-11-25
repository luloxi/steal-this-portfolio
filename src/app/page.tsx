import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { HomeView } from "@/components/views/home-view";
import { homeCopy } from "@/content/home-copy";
import { servicesCopy } from "@/content/services-copy";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/prefs";
import { pathPair } from "@/lib/routes";
import { faqLd, personLd, serviceLd, websiteLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import { getFaq } from "@/lib/faq-db";
import "./home.css";
import "./showcase.css";
import "./landing.css";

/** Home share card: fixed service pitch (not the D1 site description). */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { meta } = homeCopy[locale];
  const base = await buildPageMetadata(
    locale,
    pathPair("/"),
    { title: null, description: meta.description },
    { fullTitle: meta.title },
  );
  return { ...base, keywords: meta.keywords };
}

const JOB_TITLE = {
  es: "Consultor en automatización con IA",
  en: "AI automation consultant",
} as const;
const KNOWS_ABOUT = {
  es: ["Automatización de procesos", "Agentes de IA", "Grok", "Grok Bot", "Hermes", "n8n", "CRM a medida", "Herramientas internas", "Next.js", "Cloudflare"],
  en: ["Process automation", "AI agents", "Grok", "Grok Bot", "Hermes", "n8n", "Custom CRM", "Internal tools", "Next.js", "Cloudflare"],
} as const;

/**
 * Landing: hero, problem, what it does on its own, trust strip, things built,
 * how we work, about, FAQ, closing CTA.
 * Projects, blog and the full story live on their own pages.
 */
export default async function HomePage() {
  const locale = await getRequestLocale();
  const [settings, faq] = await Promise.all([getSiteSettings(), getFaq(locale)]);
  const c = homeCopy[locale];
  // The saved FAQ list (D1 landing_faq, else the code seed): the page and the schema show the same thing.
  const svc = servicesCopy[locale];
  const graph = [
    personLd(settings, locale, JOB_TITLE[locale], [...KNOWS_ABOUT[locale]]),
    websiteLd(settings, locale, c.meta.description),
    serviceLd(settings, locale, { name: svc.title, description: c.meta.description, offers: svc.offers }),
    faqLd(faq),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <HomeView faq={faq} />
    </>
  );
}
