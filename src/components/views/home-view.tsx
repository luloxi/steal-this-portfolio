"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { Hammer, Search, Signpost } from "lucide-react";
import { HireButton } from "@/components/hire-button";
import { ScrollRevealFallback } from "@/components/scroll-reveal-fallback";
import { AgentFlow } from "@/components/home-visuals";
import { HomeHeader } from "@/components/home-header";
import { GitHubIcon, InstagramBrandIcon, LinkedInIcon, TelegramIcon, XIcon } from "@/components/icons/social";
import { useSiteSettings } from "@/components/site-settings-context";
import { DemoVideo } from "@/components/demo-video";
import { ShowcaseVisual } from "@/components/showcase-visuals";
import { homeCopy, homeMore } from "@/content/home-copy";
import { FEATURED_PROJECTS, GROK_BOT_SHOWCASE } from "@/content/showcase";
import { useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/types";
import { thumb } from "@/lib/thumbs";

export type HomePost = {
  slug: string;
  slugEn: string | null;
  date: string;
  cover: string;
  copy: Record<Locale, { title: string; summary: string }>;
};


const socialIcons: Record<string, ComponentType<{ className?: string }>> = {
  x: XIcon,
  instagram: InstagramBrandIcon,
  telegram: TelegramIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
};

const accents = ["var(--joy-1)", "var(--joy-2)", "var(--joy-3)", "var(--joy-4)", "var(--joy-5)"];
const offerIcons = [Search, Signpost, Hammer];

/** Scrolling landing page. Theme and language controls stay fixed in the layout. */
export function HomeView({ posts }: { posts: HomePost[] }) {
  const { t, href, locale } = useLocale();
  const site = useSiteSettings();
  const c = homeCopy[locale];
  const m = homeMore[locale];
  const nav: { label: string; to: string; hire?: boolean }[] = [
    { label: m.nav.about, to: "#sobre-mi" },
    { label: m.nav.services, to: "#servicios" },
    { label: m.nav.projects, to: "#proyectos" },
    { label: m.nav.blog, to: href("/blog") },
    { label: m.nav.contact, to: href("/contacto") },
    { label: m.nav.hire, to: href("/contratar"), hire: true },
  ];
  const socials = [
    ...site.socials.filter((s) => s.id !== "github"),
    ...(site.githubHref ? [{ id: "github", label: "GitHub", href: site.githubHref }] : []),
  ];

  return (
    <div className="hm hm-landing">
      <ScrollRevealFallback />
      <HomeHeader items={nav} label={locale === "es" ? "Secciones" : "Sections"} menuLabel={locale === "es" ? "Menú" : "Menu"} homeHref={href("/")} />
      <main className="hm-main">
        <header className="hm-hero">
          <div className="hm-hero-text">
          <h1 className="hm-title">{c.title}</h1>
          <p className="hm-lead">{c.lead}</p>
          <div className="hm-cta">
            <HireButton />
          </div>
          </div>
          <div className="hm-hero-art">
            <AgentFlow coreLabel={locale === "en" ? "AI" : "IA"} />
          </div>
        </header>

        <section id="sobre-mi" className="hm-section hm-anchor" aria-labelledby="hm-about">
          <h2 id="hm-about" className="hm-h2">{m.about.title}</h2>
          <div className="hm-about" data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatar-portrait.webp" alt={site.legalName} width={600} height={800} loading="lazy" decoding="async" className="hm-about-photo" />
            <div className="hm-about-text">
              <p className="hm-about-body">{m.about.body}</p>
              <Link href={href("/sobre-mi")} className="hm-more">{m.about.more} ▸</Link>
            </div>
          </div>
        </section>

        <section id="servicios" className="hm-section hm-anchor" aria-labelledby="hm-services">
          <h2 id="hm-services" className="hm-h2">{m.services.title}</h2>
          <p className="hm-sublead">{m.services.lead}</p>
          <ol className="sc-grid hm-offer">
            {m.services.steps.map((step, i) => {
              const Icon = offerIcons[i % offerIcons.length];
              return (
                <li
                  key={step.title}
                  className="sc-card hm-offer-step"
                  data-reveal
                  style={{ ["--hm-accent" as string]: accents[i % accents.length], ["--i" as string]: i }}
                >
                  <span className="hm-offer-icon" aria-hidden>
                    <Icon />
                    <span className="hm-offer-n">{i + 1}</span>
                  </span>
                  <h3 className="hm-card-title">{step.title}</h3>
                  <p className="hm-card-body">{step.body}</p>
                </li>
              );
            })}
          </ol>
          <h3 id="hm-cases" className="hm-cases-title">{m.services.casesTitle}</h3>
          <ul className="hm-cases" aria-labelledby="hm-cases">
            {GROK_BOT_SHOWCASE.map((item, i) => {
              const copy = item.copy[locale];
              return (
                <li key={item.art} className="hm-case" data-reveal style={{ ["--hm-accent" as string]: accents[(i + 2) % accents.length], ["--i" as string]: i }}>
                  <div className="sc-stage hm-case-art">
                    <ShowcaseVisual art={item.art} />
                  </div>
                  <p className="hm-case-text">
                    <strong>{copy.title}.</strong> {copy.body}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="hm-cta">
            <Link href={href("/contratar")} className="hm-cta-link">{m.services.cta}</Link>
          </div>
          <Link href={href("/servicios")} className="hm-more hm-more-center">{m.services.more} ▸</Link>
        </section>

        <section id="proyectos" className="hm-section hm-anchor" aria-labelledby="hm-built">
          <h2 id="hm-built" className="hm-h2">{m.projects.title}</h2>
          <ul className="cs-grid">
            {FEATURED_PROJECTS.map((fp, i) => {
              const copy = fp.copy[locale];
              const media = <DemoVideo name={fp.media} label={copy.mediaAlt} />;
              return (
                <li key={fp.media} className="cs-card" data-reveal style={{ ["--hm-accent" as string]: fp.accent, ["--i" as string]: i }}>
                  {fp.projectId ? (
                    <Link href={href(`/proyectos/${fp.projectId}`)} className="cs-media" aria-label={copy.name}>{media}</Link>
                  ) : (
                    <div className="cs-media is-static">{media}</div>
                  )}
                  <div className="cs-body">
                    <h3 className="cs-title">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb(fp.icon)} alt="" width={28} height={28} loading="lazy" decoding="async" className="cs-icon" />
                      {fp.projectId ? <Link href={href(`/proyectos/${fp.projectId}`)} className="cs-title-link">{copy.name}</Link> : copy.name}
                    </h3>
                    <p className="cs-tagline">{copy.tagline}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {posts.length ? (
          <section className="hm-section" aria-labelledby="hm-blog">
            <h2 id="hm-blog" className="hm-h2">{m.blog.title}</h2>
            <ul className="hm-posts">
              {posts.map((post, i) => {
                const copy = post.copy[locale] ?? post.copy.es;
                const slug = locale === "en" && post.slugEn ? post.slugEn : post.slug;
                return (
                  <li key={post.slug} data-reveal style={{ ["--i" as string]: i }}>
                    <Link href={href(`/blog/${slug}`)} className="hm-post">
                      {post.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb(post.cover)} alt="" width={320} height={180} loading="lazy" decoding="async" className="hm-post-cover" />
                      ) : null}
                      <span className="hm-post-date">{post.date}</span>
                      <span className="hm-post-title">{copy.title}</span>
                      <span className="hm-post-sum">{copy.summary}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href={href("/blog")} className="hm-more">{m.blog.all} ▸</Link>
          </section>
        ) : null}

        <section className="hm-section" aria-labelledby="hm-faq">
          <h2 id="hm-faq" className="hm-h2">{c.faq.title}</h2>
          <div className="hm-faq">
            {c.faq.items.map((item) => (
              <details key={item.q} className="hm-faq-item" data-reveal>
                <summary className="hm-faq-q">{item.q}</summary>
                <p className="hm-faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="hm-closing" data-reveal>
          <p>{c.closing}</p>
          <div className="hm-cta">
            <HireButton />
          </div>
        </section>

        <p className="hm-agents">
          {c.agents.lead} <a href="/llms.txt" className="hm-agents-link">{c.agents.link}</a>
        </p>
      </main>

      <footer className="hm-footer">
        <nav className="hm-footer-links" aria-label="Social">
          <Link href={href("/servicios")} className="hm-footer-blog">{c.footer.services}</Link>
          <Link href={href("/blog")} className="hm-footer-blog">{t.sections.blog}</Link>
          {socials.map((s) => {
            const Icon = socialIcons[s.id];
            return (
              <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" className="hm-social" aria-label={s.label} title={s.label}>
                {Icon ? <Icon className="hm-social-icon" /> : s.label}
              </a>
            );
          })}
        </nav>
        <a className="hm-steal" href="https://github.com/luloxi/steal-this-portfolio" target="_blank" rel="noopener noreferrer">
          <GitHubIcon className="hm-steal-icon" />
          {t.ui.stealPortfolio}
        </a>
      </footer>
    </div>
  );
}
