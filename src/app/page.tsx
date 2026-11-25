import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { HomeView, type HomePost } from "@/components/views/home-view";
import { HOME_PROJECT_IDS, homeCopy } from "@/content/home-copy";
import { servicesCopy } from "@/content/services-copy";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/prefs";
import { getPublishedPosts } from "@/lib/blog";
import { getProjects } from "@/lib/projects-db";
import { pathPair } from "@/lib/routes";
import { faqLd, personLd, projectsLd, serviceLd, websiteLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
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
 * Landing: hero, about, services (3 steps + examples), featured projects
 * with demo loops (Malito, Garpen), latest posts, process, FAQ, closing CTA.
 */
export default async function HomePage() {
  const [locale, all, settings, allPosts] = await Promise.all([
    getRequestLocale(),
    getProjects(),
    getSiteSettings(),
    getPublishedPosts().catch(() => []),
  ]);
  // Only the projects offered on the landing (with a demo) go into its JSON-LD.
  const featured = new Set<string>(HOME_PROJECT_IDS);
  const shown = all.filter((p) => p.visible && featured.has(p.id));
  const posts: HomePost[] = allPosts.slice(0, 3).map((p) => ({
    slug: p.slug,
    slugEn: p.slugEn ?? null,
    date: p.publishedAt.slice(0, 10),
    cover: p.coverImage,
    copy: {
      es: { title: p.title.es, summary: p.summary.es },
      en: { title: p.title.en || p.title.es, summary: p.summary.en || p.summary.es },
    },
  }));
  const c = homeCopy[locale];
  const svc = servicesCopy[locale];
  const graph = [
    personLd(settings, locale, JOB_TITLE[locale], [...KNOWS_ABOUT[locale]]),
    websiteLd(settings, locale, c.meta.description),
    serviceLd(settings, locale, { name: svc.title, description: c.meta.description, offers: svc.offers }),
    projectsLd(settings, locale, shown.map((p) => ({ id: p.id, icon: p.icon, title: p.copy[locale].title, body: p.copy[locale].body }))),
    faqLd(c.faq.items),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <HomeView posts={posts} />
    </>
  );
}
