"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { ContactTrigger } from "@/components/contact-modal";
import { BuiltShot, FlowChips, HeroFlow } from "@/components/landing-visuals";
import { HomeHeader } from "@/components/home-header";
import { CopyText } from "@/components/copy-text";
import { FaqList } from "@/components/faq-list";
import type { FaqItem } from "@/lib/faq";
import { GitHubIcon, InstagramBrandIcon, LinkedInIcon, TelegramIcon, XIcon } from "@/components/icons/social";
import { useSiteSettings } from "@/components/site-settings-context";
import { BUILT_ART, CASE_HUMAN_STEP } from "@/content/home-copy";
import { useLocale } from "@/i18n/locale-provider";

const socialIcons: Record<string, ComponentType<{ className?: string }>> = {
  x: XIcon,
  instagram: InstagramBrandIcon,
  telegram: TelegramIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
};

/**
 * Phones: the main button stays at the bottom once the hero is gone,
 * and steps aside from the closing button on (it is already there).
 */
function useStickyCta() {
  const heroRef = useRef<HTMLElement>(null);
  const closingRef = useRef<HTMLElement>(null);
  const [heroOut, setHeroOut] = useState(false);
  const [closingIn, setClosingIn] = useState(false);
  useEffect(() => {
    const hero = heroRef.current;
    const closing = closingRef.current;
    if (!hero || !closing || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setHeroOut(!e.isIntersecting && e.boundingClientRect.top < 0);
        if (e.target === closing) setClosingIn(e.isIntersecting || e.boundingClientRect.top < 0);
      }
    });
    io.observe(hero);
    io.observe(closing);
    return () => io.disconnect();
  }, []);
  return { heroRef, closingRef, show: heroOut && !closingIn };
}

/** Scrolling landing page. Theme and language controls stay fixed in the layout. */
export function HomeView({ faq }: { faq: FaqItem[] }) {
  const { t, href, locale, landing } = useLocale();
  const site = useSiteSettings();
  // Code defaults + edits saved from edit mode (D1 site_copy "landing.*").
  const c = landing.home;
  const m = landing.more;
  const { heroRef, closingRef, show: stickyOn } = useStickyCta();
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
    <div className="hm hm-landing ln">
      <HomeHeader items={nav} label={locale === "es" ? "Secciones" : "Sections"} menuLabel={locale === "es" ? "Menú" : "Menu"} homeHref={href("/")} />
      <main className="hm-main ln-main">
        <header className="ln-hero" ref={heroRef}>
          <div className="ln-hero-text">
            <CopyText as="p" className="ln-kicker" copyKey="landing.home.kicker" value={c.kicker} />
            <CopyText as="h1" className="ln-title" copyKey="landing.home.title" value={c.title} />
            <CopyText as="p" className="ln-lead" copyKey="landing.home.lead" value={c.lead} />
            <div className="ln-actions">
              <ContactTrigger className="hm-cta-link ln-btn" data-testid="hero-cta"><CopyText copyKey="landing.home.cta" value={c.cta} /></ContactTrigger>
              <a href="#que-hace-solo" className="hm-more ln-btn"><CopyText copyKey="landing.home.cta2" value={c.cta2} /></a>
            </div>
            <ul className="ln-checks">
              {c.checks.map((x, i) => (
                <li key={i}><CopyText copyKey={`landing.home.checks.${i}`} value={x} /></li>
              ))}
            </ul>
          </div>
          <HeroFlow
            inputs={c.flow.inputs}
            core={c.flow.core}
            human={c.flow.human}
            outputs={c.flow.outputs}
            label={locale === "es" ? "Cómo viaja una tarea sola hasta donde la necesitás" : "How a task travels on its own to where you need it"}
          />
        </header>

        <section className="ln-section ln-problem">
          <CopyText as="h2" className="ln-h2" copyKey="landing.home.problem.title" value={c.problem.title} />
          <CopyText as="p" className="ln-body" copyKey="landing.home.problem.body" value={c.problem.body} />
        </section>

        <section id="que-hace-solo" className="ln-section hm-anchor" aria-labelledby="ln-cases">
          <h2 id="ln-cases" className="ln-h2"><CopyText copyKey="landing.home.cases.title" value={c.cases.title} /></h2>
          <CopyText as="p" className="ln-note" copyKey="landing.home.cases.note" value={c.cases.note} />
          <ul className="ln-cases">
            {c.cases.items.map((it, i) => (
              <li key={i} className="ln-case">
                <CopyText as="p" className="ln-case-problem" copyKey={`landing.home.cases.items.${i}.problem`} value={it.problem} />
                <CopyText as="p" className="ln-case-body" copyKey={`landing.home.cases.items.${i}.solves`} value={it.solves} />
                <FlowChips steps={it.flow} human={CASE_HUMAN_STEP[i] ?? -1} />
              </li>
            ))}
          </ul>
        </section>

        <section className="ln-trust" aria-labelledby="ln-trust">
          <h2 id="ln-trust" className="ln-h3"><CopyText copyKey="landing.home.trust.title" value={c.trust.title} /></h2>
          <ul className="ln-trust-list">
            {c.trust.items.map((x, i) => (
              <li key={i}><CopyText copyKey={`landing.home.trust.items.${i}`} value={x} /></li>
            ))}
          </ul>
        </section>

        <section className="ln-section" aria-labelledby="ln-built">
          <h2 id="ln-built" className="ln-h2"><CopyText copyKey="landing.home.built.title" value={c.built.title} /></h2>
          <CopyText as="p" className="ln-note" copyKey="landing.home.built.note" value={c.built.note} />
          <ul className="ln-built">
            {c.built.items.map((it, i) => (
              <li key={i} className="ln-built-item">
                {BUILT_ART[i] ? <BuiltShot art={BUILT_ART[i]} locale={locale} /> : null}
                <div className="ln-built-text">
                  <CopyText as="p" className="ln-built-lead" copyKey={`landing.home.built.items.${i}.lead`} value={it.lead} />
                  <CopyText as="h3" className="ln-built-title" copyKey={`landing.home.built.items.${i}.title`} value={it.title} />
                  <CopyText as="p" className="ln-built-detail" copyKey={`landing.home.built.items.${i}.detail`} value={it.detail} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="servicios" className="ln-section hm-anchor" aria-labelledby="ln-process">
          <h2 id="ln-process" className="ln-h2"><CopyText copyKey="landing.home.process.title" value={c.process.title} /></h2>
          <ol className="ln-steps">
            {c.process.steps.map((step, i) => (
              <li key={i} className="ln-step">
                <span className="ln-step-n" aria-hidden>{i + 1}</span>
                <CopyText as="h3" className="ln-step-title" copyKey={`landing.home.process.steps.${i}.title`} value={step.title} />
                <CopyText as="p" className="ln-step-body" copyKey={`landing.home.process.steps.${i}.body`} value={step.body} />
              </li>
            ))}
          </ol>
          <CopyText as="p" className="ln-note ln-pay" copyKey="landing.home.process.pay" value={c.process.pay} />
          <Link href={href("/servicios")} className="ln-textlink">{c.footer.services} ▸</Link>
        </section>

        <section id="sobre-mi" className="ln-section hm-anchor" aria-labelledby="ln-about">
          <h2 id="ln-about" className="ln-h2"><CopyText copyKey="landing.more.about.title" value={m.about.title} /></h2>
          <div className="ln-about">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatar-portrait.webp" alt={site.legalName} width={600} height={800} loading="lazy" decoding="async" className="ln-about-photo" />
            <div className="ln-about-text">
              <CopyText as="p" className="ln-body" copyKey="landing.more.about.body" value={m.about.body} />
              <Link href={href("/sobre-mi")} className="hm-more ln-btn-sm"><CopyText copyKey="landing.more.about.more" value={m.about.more} /> ▸</Link>
            </div>
          </div>
        </section>

        <section className="ln-section" aria-labelledby="ln-faq">
          <h2 id="ln-faq" className="ln-h2"><CopyText copyKey="landing.home.faq.title" value={c.faq.title} /></h2>
          <FaqList items={faq} />
        </section>

        <section className="ln-closing" ref={closingRef}>
          <CopyText as="h2" className="ln-closing-title" copyKey="landing.home.closing.title" value={c.closing.title} />
          <CopyText as="p" className="ln-body" copyKey="landing.home.closing.body" value={c.closing.body} />
          <ContactTrigger className="hm-cta-link ln-btn" data-testid="closing-cta"><CopyText copyKey="landing.home.closing.cta" value={c.closing.cta} /></ContactTrigger>
        </section>

        <p className="hm-agents">
          <CopyText copyKey="landing.home.agents.lead" value={c.agents.lead} />{" "}
          <a href="/llms.txt" className="hm-agents-link"><CopyText copyKey="landing.home.agents.link" value={c.agents.link} /></a>
        </p>
      </main>

      <div className={stickyOn ? "ln-sticky is-on" : "ln-sticky"} aria-hidden={!stickyOn}>
        <ContactTrigger className="hm-cta-link ln-btn" tabIndex={stickyOn ? 0 : -1} data-testid="sticky-cta">{c.cta}</ContactTrigger>
      </div>
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
