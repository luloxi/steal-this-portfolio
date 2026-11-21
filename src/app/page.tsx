import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { HomeView, type HomeProject } from "@/components/views/home-view";
import { HOME_PROJECT_IDS, homeCopy } from "@/content/home-copy";
import { servicesCopy } from "@/content/services-copy";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/prefs";
import { getProjects } from "@/lib/projects-db";
import { pathPair } from "@/lib/routes";
import { faqLd, personLd, projectsLd, serviceLd, websiteLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import "./home.css";

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
  es: "Desarrollador de automatizaciones con agentes de IA y n8n",
  en: "Automation developer with AI agents and n8n",
} as const;
const KNOWS_ABOUT = {
  es: ["Automatización de procesos", "Agentes de IA", "n8n", "CRM a medida", "Herramientas internas", "Next.js", "Cloudflare"],
  en: ["Process automation", "AI agents", "n8n", "Custom CRM", "Internal tools", "Next.js", "Cloudflare"],
} as const;

/** Landing: hero, examples, custom work, three built projects (from D1), process, FAQ, closing CTA. */
export default async function HomePage() {
  const [locale, all, settings] = await Promise.all([getRequestLocale(), getProjects(), getSiteSettings()]);
  const projects: HomeProject[] = HOME_PROJECT_IDS.flatMap((id) => {
    const p = all.find((x) => x.id === id && x.visible);
    if (!p) return [];
    const pick = (c: { title: string; body: string }) => ({ title: c.title, body: c.body });
    return [{ id: p.id, icon: p.icon, copy: { es: pick(p.copy.es), en: pick(p.copy.en) } }];
  });
  const c = homeCopy[locale];
  const svc = servicesCopy[locale];
  const graph = [
    personLd(settings, locale, JOB_TITLE[locale], [...KNOWS_ABOUT[locale]]),
    websiteLd(settings, locale, c.meta.description),
    serviceLd(settings, locale, { name: svc.title, description: c.meta.description, offers: svc.offers }),
    projectsLd(settings, locale, projects.map((p) => ({ id: p.id, icon: p.icon, ...p.copy[locale] }))),
    faqLd(c.faq.items),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <HomeView projects={projects} />
    </>
  );
}
