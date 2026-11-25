"use client";

import Link from "next/link";
import { useEffect, type ComponentType } from "react";
import { Hammer, Search, Signpost } from "lucide-react";
import { HireButton } from "@/components/hire-button";
import { ScrollRevealFallback } from "@/components/scroll-reveal-fallback";
import { AgentFlow } from "@/components/home-visuals";
import { HomeHeader } from "@/components/home-header";
import { GitHubIcon, InstagramBrandIcon, LinkedInIcon, TelegramIcon, XIcon } from "@/components/icons/social";
import { useSiteSettings } from "@/components/site-settings-context";
import { ShowcaseVisual } from "@/components/showcase-visuals";
import { homeCopy, homeMore } from "@/content/home-copy";
import { GROK_BOT_SHOWCASE } from "@/content/showcase";
import { useLocale } from "@/i18n/locale-provider";



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
export function HomeView() {
  const { t, href, locale } = useLocale();
  const site = useSiteSettings();
  const c = homeCopy[locale];
  const m = homeMore[locale];
  const nav: { label: string; to: string; hire?: boolean }[] = [
    { label: m.nav.services, to: "#servicios" },
    { label: m.nav.projects, to: href("/proyectos") },
    { label: m.nav.blog, to: href("/blog") },
    { label: m.nav.about, to: href("/sobre-mi") },
    { label: m.nav.contact, to: href("/contacto") },
    { label: m.nav.hire, to: href("/contratar"), hire: true },
  ];
  // Old links to the removed landing sections land on their pages now.
  useEffect(() => {
    const to = { "#proyectos": "/proyectos", "#blog": "/blog" }[window.location.hash];
    if (to) window.location.replace(href(to));
  }, [href]);
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
