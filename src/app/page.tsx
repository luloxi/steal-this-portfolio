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
import { getCopyOverrides } from "@/lib/site-copy";
import { applyCopy } from "@/i18n/copy-overrides";
import { landingCopy } from "@/i18n/landing";
import "./home.css";
import "./showcase.css";
import "./scroll-motion.css";

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
  es: "Consultor en automatización para independientes y freelancers",
  en: "Automation consultant for freelancers and independent professionals",
} as const;
const KNOWS_ABOUT = {
  es: ["Automatización de procesos", "Agentes de IA", "Grok", "Grok Bot", "Hermes", "n8n", "CRM a medida", "Herramientas internas", "Next.js", "Cloudflare"],
  en: ["Process automation", "AI agents", "Grok", "Grok Bot", "Hermes", "n8n", "Custom CRM", "Internal tools", "Next.js", "Cloudflare"],
} as const;

/**
 * Landing: hero, services (3 steps + examples), FAQ, about, closing CTA.
 * Projects, blog and the full story live on their own pages.
 */
export default async function HomePage() {
  const [locale, settings, overrides] = await Promise.all([getRequestLocale(), getSiteSettings(), getCopyOverrides()]);
  const c = homeCopy[locale];
  // The FAQ schema follows the edited FAQ (what visitors read).
  const faq = applyCopy({ landing: landingCopy(locale) }, overrides[locale]).landing.home.faq;
  const svc = servicesCopy[locale];
  const graph = [
    personLd(settings, locale, JOB_TITLE[locale], [...KNOWS_ABOUT[locale]]),
    websiteLd(settings, locale, c.meta.description),
    serviceLd(settings, locale, { name: svc.title, description: c.meta.description, offers: svc.offers }),
    faqLd(faq.items),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <HomeView />
    </>
  );
}
