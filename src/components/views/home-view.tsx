"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { HandCoins, MessageSquareText, PhoneCall } from "lucide-react";
import { HireButton } from "@/components/hire-button";
import { AgentFlow, DataMove, MailSort, ReceiptScan } from "@/components/home-visuals";
import { HomeHeader } from "@/components/home-header";
import { GitHubIcon, InstagramBrandIcon, LinkedInIcon, TelegramIcon, XIcon } from "@/components/icons/social";
import { useSiteSettings } from "@/components/site-settings-context";
import { DemoVideo } from "@/components/demo-video";
import { ShowcaseVisual } from "@/components/showcase-visuals";
import { homeCopy, homeMore } from "@/content/home-copy";
import { SERVICE_PAGES } from "@/content/service-pages";
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
const exampleArt = [MailSort, DataMove, ReceiptScan];
const stepIcons = [MessageSquareText, PhoneCall, HandCoins];

/** Scrolling landing page. Theme and language controls stay fixed in the layout. */
export function HomeView({ posts }: { posts: HomePost[] }) {
  const { t, href, locale } = useLocale();
  const site = useSiteSettings();
  const c = homeCopy[locale];
  const m = homeMore[locale];
  const nav: { label: string; to: string; hire?: boolean }[] = [
    { label: m.nav.about, to: "#sobre-mi" },
    { label: m.nav.showcase, to: "#automatizando" },
    { label: m.nav.services, to: href("/servicios") },
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
    <div className="hm">
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

        <section id="automatizando" className="hm-section hm-anchor" aria-labelledby="hm-showcase">
          <h2 id="hm-showcase" className="hm-h2">{m.showcase.title}</h2>
          <p className="hm-sublead">{m.showcase.lead}</p>
          <ul className="sc-grid">
            {GROK_BOT_SHOWCASE.map((item, i) => {
              const copy = item.copy[locale];
              return (
                <li
                  key={item.art}
                  className="sc-card"
                  data-reveal
                  style={{ ["--hm-accent" as string]: accents[i % accents.length] }}
                >
                  <div className="sc-stage">
                    <ShowcaseVisual art={item.art} />
                  </div>
                  <h3 className="hm-card-title">{copy.title}</h3>
                  <p className="hm-card-body">{copy.body}</p>
                </li>
              );
            })}
          </ul>
          <div className="hm-cta">
            <Link href={href("/contratar")} className="hm-cta-link">{m.showcase.cta}</Link>
          </div>
        </section>

        <section className="hm-section" aria-labelledby="hm-examples">
          <h2 id="hm-examples" className="hm-h2">{c.examples.title}</h2>
          <ul className="hm-cards">
            {c.examples.items.map((item, i) => (
              <li key={item.title} className="hm-card" data-reveal style={{ ["--hm-accent" as string]: accents[i % accents.length] }}>
                {(() => {
                  const Art = exampleArt[i % exampleArt.length];
                  return <Art />;
                })()}
                <h3 className="hm-card-title">{item.title}</h3>
                <p className="hm-card-body">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="servicios" className="hm-section hm-anchor" aria-labelledby="hm-services">
          <h2 id="hm-services" className="hm-h2">{m.services.title}</h2>
          <p className="hm-sublead">{m.services.lead}</p>
          <ul className="sv-chips">
            {SERVICE_PAGES.map((sp) => (
              <li key={sp.slug} data-reveal>
                <Link href={href(`/servicios/${sp.slug}`)} className="sv-chip">
                  <span>{sp.copy[locale].label}</span>
                  <span aria-hidden>▸</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="proyectos" className="hm-section hm-anchor" aria-labelledby="hm-built">
          <h2 id="hm-built" className="hm-h2">{m.projects.title}</h2>
          <ul className="cs-grid">
            {FEATURED_PROJECTS.map((fp) => {
              const copy = fp.copy[locale];
              const media = <DemoVideo name={fp.media} label={copy.mediaAlt} />;
              return (
                <li key={fp.media} className="cs-card" data-reveal style={{ ["--hm-accent" as string]: fp.accent }}>
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
              {posts.map((post) => {
                const copy = post.copy[locale] ?? post.copy.es;
                const slug = locale === "en" && post.slugEn ? post.slugEn : post.slug;
                return (
                  <li key={post.slug} data-reveal>
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

        <section className="hm-section" aria-labelledby="hm-process">
          <h2 id="hm-process" className="hm-h2">{c.process.title}</h2>
          <ol className="hm-steps">
            {c.process.steps.map((step, i) => (
              <li key={step} className="hm-step" data-reveal>
                <span className="hm-step-icon" aria-hidden>
                  {(() => {
                    const Icon = stepIcons[i % stepIcons.length];
                    return <Icon />;
                  })()}
                  <span className="hm-step-n">{i + 1}</span>
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
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

        <section className="hm-closing" data-reveal>
          <p>{c.closing}</p>
          <div className="hm-cta">
            <HireButton />
          </div>
        </section>
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
