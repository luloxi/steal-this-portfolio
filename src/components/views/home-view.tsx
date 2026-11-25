"use client";

import Link from "next/link";
import { useEffect, type ComponentType } from "react";
import { Hammer, Search, Signpost } from "lucide-react";
import { ContactTrigger } from "@/components/contact-modal";
import { HireButton } from "@/components/hire-button";
import { ScrollRevealFallback } from "@/components/scroll-reveal-fallback";
import { AgentFlow } from "@/components/home-visuals";
import { HomeHeader } from "@/components/home-header";
import { CopyText } from "@/components/copy-text";
import { GitHubIcon, InstagramBrandIcon, LinkedInIcon, TelegramIcon, XIcon } from "@/components/icons/social";
import { useSiteSettings } from "@/components/site-settings-context";
import { ShowcaseVisual } from "@/components/showcase-visuals";
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
  const { t, href, locale, landing } = useLocale();
  const site = useSiteSettings();
  // Code defaults + edits saved from edit mode (D1 site_copy "landing.*").
  const c = landing.home;
  const m = landing.more;
  const nav: { label: string; to: string; hire?: boolean }[] = [
    { label: m.nav.services, to: "#servicios" },
    { label: m.nav.projects, to: href("/proyectos") },
    { label: m.nav.blog, to: href("/blog") },
    { label: m.nav.about, to: href("/sobre-mi") },
    { label: m.nav.contact, to: href("/contacto") },
    { label: m.nav.hire, to: href("/contacto"), hire: true },
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
          <CopyText as="h1" className="hm-title" copyKey="landing.home.title" value={c.title} />
          <CopyText as="p" className="hm-lead" copyKey="landing.home.lead" value={c.lead} />
          <div className="hm-cta">
            <HireButton />
          </div>
          </div>
          <div className="hm-hero-art">
            <AgentFlow coreLabel={locale === "en" ? "AI" : "IA"} />
          </div>
        </header>

        <section id="servicios" className="hm-section hm-anchor" aria-labelledby="hm-services">
          <h2 id="hm-services" className="hm-h2"><CopyText copyKey="landing.more.services.title" value={m.services.title} /></h2>
          <CopyText as="p" className="hm-sublead" copyKey="landing.more.services.lead" value={m.services.lead} />
          <ol className="sc-grid hm-offer">
            {m.services.steps.map((step, i) => {
              const Icon = offerIcons[i % offerIcons.length];
              return (
                <li
                  key={i}
                  className="sc-card hm-offer-step"
                  data-reveal
                  style={{ ["--hm-accent" as string]: accents[i % accents.length], ["--i" as string]: i }}
                >
                  <span className="hm-offer-icon" aria-hidden>
                    <Icon />
                    <span className="hm-offer-n">{i + 1}</span>
                  </span>
                  <CopyText as="h3" className="hm-card-title" copyKey={`landing.more.services.steps.${i}.title`} value={step.title} />
                  <CopyText as="p" className="hm-card-body" copyKey={`landing.more.services.steps.${i}.body`} value={step.body} />
                </li>
              );
            })}
          </ol>
          <h3 id="hm-cases" className="hm-cases-title"><CopyText copyKey="landing.more.services.casesTitle" value={m.services.casesTitle} /></h3>
          <ul className="hm-cases" aria-labelledby="hm-cases">
            {GROK_BOT_SHOWCASE.map((item, i) => {
              const copy = landing.cases[i] ?? item.copy[locale];
              return (
                <li key={item.art} className="hm-case" data-reveal style={{ ["--hm-accent" as string]: accents[(i + 2) % accents.length], ["--i" as string]: i }}>
                  <div className="sc-stage hm-case-art">
                    <ShowcaseVisual art={item.art} />
                  </div>
                  <p className="hm-case-text">
                    <strong><CopyText copyKey={`landing.cases.${i}.title`} value={copy.title} />.</strong>{" "}
                    <CopyText copyKey={`landing.cases.${i}.body`} value={copy.body} />
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="hm-cta">
            <ContactTrigger className="hm-cta-link"><CopyText copyKey="landing.more.services.cta" value={m.services.cta} /></ContactTrigger>
          </div>
          <Link href={href("/servicios")} className="hm-more hm-more-center"><CopyText copyKey="landing.more.services.more" value={m.services.more} /> ▸</Link>
        </section>

        <section className="hm-section" aria-labelledby="hm-faq">
          <h2 id="hm-faq" className="hm-h2"><CopyText copyKey="landing.home.faq.title" value={c.faq.title} /></h2>
          <div className="hm-faq">
            {c.faq.items.map((item, i) => (
              <details key={i} className="hm-faq-item" data-reveal>
                <summary className="hm-faq-q"><CopyText copyKey={`landing.home.faq.items.${i}.q`} value={item.q} /></summary>
                <CopyText as="p" className="hm-faq-a" copyKey={`landing.home.faq.items.${i}.a`} value={item.a} />
              </details>
            ))}
          </div>
        </section>

        <section id="sobre-mi" className="hm-section hm-anchor" aria-labelledby="hm-about">
          <h2 id="hm-about" className="hm-h2"><CopyText copyKey="landing.more.about.title" value={m.about.title} /></h2>
          <div className="hm-about" data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatar-portrait.webp" alt={site.legalName} width={600} height={800} loading="lazy" decoding="async" className="hm-about-photo" />
            <div className="hm-about-text">
              <CopyText as="p" className="hm-about-body" copyKey="landing.more.about.body" value={m.about.body} />
              <Link href={href("/sobre-mi")} className="hm-more"><CopyText copyKey="landing.more.about.more" value={m.about.more} /> ▸</Link>
            </div>
          </div>
        </section>

        <section className="hm-closing" data-reveal>
          <CopyText as="p" copyKey="landing.home.closing" value={c.closing} />
          <div className="hm-cta">
            <HireButton />
          </div>
        </section>

        <p className="hm-agents">
          <CopyText copyKey="landing.home.agents.lead" value={c.agents.lead} />{" "}
          <a href="/llms.txt" className="hm-agents-link"><CopyText copyKey="landing.home.agents.link" value={c.agents.link} /></a>
        </p>
      </main>

      <footer className="hm-footer">
        <nav className="hm-footer-links" aria-label="Social">
          <Link href={href("/servicios")} className="hm-footer-blog"><CopyText copyKey="landing.home.footer.services" value={c.footer.services} /></Link>
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
