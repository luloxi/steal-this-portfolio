"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type ComponentType, type PointerEvent } from "react";
import { HandCoins, MessageSquareText, PhoneCall } from "lucide-react";
import { HireButton } from "@/components/hire-button";
import { AgentFlow, DataMove, MailSort, ReceiptScan } from "@/components/home-visuals";
import { bounce, playLaugh } from "@/components/laugh-button";
import { GitHubIcon, InstagramBrandIcon, LinkedInIcon, TelegramIcon, XIcon } from "@/components/icons/social";
import { useSiteSettings } from "@/components/site-settings-context";
import { DemoVideo } from "@/components/demo-video";
import { ShowcaseVisual } from "@/components/showcase-visuals";
import { homeCopy, homeMore } from "@/content/home-copy";
import { SERVICE_PAGES } from "@/content/service-pages";
import { CASE_STUDIES, GROK_BOT_SHOWCASE } from "@/content/showcase";
import { useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/types";
import { thumb } from "@/lib/thumbs";

export type HomeProject = {
  id: string;
  icon: string;
  copy: Record<Locale, { title: string; body: string }>;
};

export type HomePost = {
  slug: string;
  slugEn: string | null;
  date: string;
  cover: string;
  copy: Record<Locale, { title: string; summary: string }>;
};

const FEATURED_CASES = CASE_STUDIES.filter((c) => c.slug !== "flota-de-bots");

const socialIcons: Record<string, ComponentType<{ className?: string }>> = {
  x: XIcon,
  instagram: InstagramBrandIcon,
  telegram: TelegramIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
};

const accents = ["var(--section-contact)", "var(--section-blog)", "var(--section-projects)"];
const exampleArt = [MailSort, DataMove, ReceiptScan];
const stepIcons = [MessageSquareText, PhoneCall, HandCoins];

/** Scrolling landing page. Theme and language controls stay fixed in the layout. */
export function HomeView({ projects, posts }: { projects: HomeProject[]; posts: HomePost[] }) {
  const { t, href, locale } = useLocale();
  const site = useSiteSettings();
  const c = homeCopy[locale];
  const m = homeMore[locale];
  const caseHref = (slug: string) => href(`/casos/${slug}`);
  const nav: { label: string; to: string; hire?: boolean }[] = [
    { label: m.nav.about, to: "#sobre-mi" },
    { label: m.nav.showcase, to: "#grok-bot" },
    { label: m.nav.cases, to: "#casos" },
    { label: m.nav.services, to: href("/servicios") },
    { label: m.nav.projects, to: "#proyectos" },
    { label: m.nav.blog, to: href("/blog") },
    { label: m.nav.contact, to: href("/contacto") },
    { label: m.nav.hire, to: href("/contratar"), hire: true },
  ];
  const photoRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const touchLaughAt = useRef(0);

  // Double tap / double click on the photo: jojojo + bounce (kept from the old landing).
  const laugh = () => {
    playLaugh();
    bounce(photoRef.current, 0.45);
  };
  const onPhotoPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    const prev = lastTap.current;
    if (prev && e.timeStamp - prev.t < 380 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 40) {
      lastTap.current = null;
      touchLaughAt.current = e.timeStamp;
      laugh();
    } else {
      lastTap.current = { t: e.timeStamp, x: e.clientX, y: e.clientY };
    }
  };

  const socials = [
    ...site.socials.filter((s) => s.id !== "github"),
    ...(site.githubHref ? [{ id: "github", label: "GitHub", href: site.githubHref }] : []),
  ];

  return (
    <div className="hm">
      <main className="hm-main">
        <nav className="hm-nav" aria-label={locale === "es" ? "Secciones" : "Sections"}>
          {nav.map((n) =>
            n.to.startsWith("#") ? (
              <a key={n.label} href={n.to} className="hm-nav-link">{n.label}</a>
            ) : (
              <Link key={n.label} href={n.to} className={n.hire ? "hm-nav-link is-hire" : "hm-nav-link"}>{n.label}</Link>
            ),
          )}
        </nav>
        <header className="hm-hero">
          <div className="hm-hero-text">
          <div className="hm-id">
            <div
              ref={photoRef}
              className="hm-photo"
              onPointerDown={onPhotoPointerDown}
              onDoubleClick={(e) => {
                e.preventDefault();
                if (e.timeStamp - touchLaughAt.current < 700) return;
                laugh();
              }}
            >
              <Image src={thumb(site.heroPhoto)} alt={site.name} width={160} height={160} priority unoptimized draggable={false} />
            </div>
            <p className="hm-intro">{c.intro}</p>
          </div>
          <h1 className="hm-title">{c.title}</h1>
          <p className="hm-lead">{c.lead}</p>
          <div className="hm-cta">
            <HireButton />
          </div>
          </div>
          <div className="hm-hero-art">
            <AgentFlow />
          </div>
        </header>

        <section id="sobre-mi" className="hm-section hm-anchor" aria-labelledby="hm-about">
          <h2 id="hm-about" className="hm-h2">{m.about.title}</h2>
          <div className="hm-about" data-reveal>
            <Image src={thumb(site.heroPhoto)} alt="" width={96} height={96} unoptimized className="hm-about-photo" loading="lazy" />
            <div className="hm-about-text">
              <p className="hm-about-body">{m.about.body}</p>
              <ul className="hm-facts">
                {m.about.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link href={href("/sobre-mi")} className="hm-more">{m.about.more} ▸</Link>
            </div>
          </div>
        </section>

        <section id="grok-bot" className="hm-section hm-anchor" aria-labelledby="hm-showcase">
          <h2 id="hm-showcase" className="hm-h2">{m.showcase.title}</h2>
          <p className="hm-sublead">{m.showcase.lead}</p>
          <ul className="sc-grid">
            {GROK_BOT_SHOWCASE.map((item, i) => {
              const copy = item.copy[locale];
              return (
                <li
                  key={item.art}
                  className={item.art === "runners" ? "sc-card is-wide" : "sc-card"}
                  data-reveal
                  style={{ ["--hm-accent" as string]: accents[i % accents.length] }}
                >
                  <div className="sc-stage">
                    {item.art === "runners" ? (
                      <DemoVideo name="flota-runners" label={m.showcase.demoLabel} />
                    ) : (
                      <ShowcaseVisual art={item.art} />
                    )}
                  </div>
                  <h3 className="hm-card-title">{copy.title}</h3>
                  <p className="hm-card-body">{copy.body}</p>
                  {item.art === "runners" ? (
                    <Link href={caseHref("flota-de-bots")} className="hm-more">{m.cases.caseLink} ▸</Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="hm-cta">
            <Link href={href("/contratar")} className="hm-cta-link">{m.showcase.cta}</Link>
          </div>
        </section>

        <section id="casos" className="hm-section hm-anchor" aria-labelledby="hm-cases">
          <h2 id="hm-cases" className="hm-h2">{m.cases.title}</h2>
          <p className="hm-sublead">{m.cases.lead}</p>
          <ul className="cs-grid">
            {FEATURED_CASES.map((cs) => {
              const copy = cs.copy[locale];
              return (
                <li key={cs.slug} className="cs-card" data-reveal style={{ ["--hm-accent" as string]: cs.accent }}>
                  <Link href={caseHref(cs.slug)} className="cs-media" aria-label={`${copy.name}: ${m.cases.caseLink}`}>
                    <DemoVideo name={cs.media} label={copy.mediaAlt} />
                  </Link>
                  <div className="cs-body">
                    <h3 className="cs-title">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb(cs.icon)} alt="" width={28} height={28} loading="lazy" decoding="async" className="cs-icon" />
                      {copy.name}
                    </h3>
                    <p className="cs-tagline">{copy.tagline}</p>
                    <p className="cs-for">{copy.forWhom}</p>
                    <div className="cs-links">
                      <Link href={caseHref(cs.slug)} className="hm-more">{m.cases.caseLink} ▸</Link>
                      {cs.live ? (
                        <a href={cs.live} target="_blank" rel="noopener noreferrer" className="hm-more is-dim">{m.cases.open} ↗</a>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link href={href("/casos")} className="hm-more">{m.cases.all} ▸</Link>
        </section>

        <section className="hm-section" aria-labelledby="hm-examples">
          <h2 id="hm-examples" className="hm-h2">{c.examples.title}</h2>
          <p className="hm-note">{c.examples.note}</p>
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

        <section className="hm-section" aria-labelledby="hm-custom">
          <h2 id="hm-custom" className="hm-h2">{c.custom.title}</h2>
          <p className="hm-field" data-reveal>{c.custom.body}</p>
        </section>

        <section className="hm-section" aria-labelledby="hm-services">
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

        {projects.length ? (
          <section id="proyectos" className="hm-section hm-anchor" aria-labelledby="hm-built">
            <h2 id="hm-built" className="hm-h2">{m.projects.title}</h2>
            <ul className="hm-tiles">
              {projects.map((p, i) => {
                const copy = p.copy[locale] ?? p.copy.es;
                return (
                  <li key={p.id} data-reveal>
                    <Link
                      href={href(`/proyectos/${p.id}`)}
                      className="hm-tile"
                      style={{ ["--hm-accent" as string]: accents[i % accents.length] }}
                    >
                      <span className="hm-tile-logo" aria-hidden>
                        {p.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb(p.icon)} alt="" width={64} height={64} loading="lazy" decoding="async" className="project-icon" />
                        ) : null}
                      </span>
                      <span className="hm-tile-title">{copy.title}</span>
                      <span className="hm-tile-body">{copy.body}</span>
                      <span className="hm-tile-go" aria-hidden>▸</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href={href("/proyectos")} className="hm-more">{m.projects.all} ▸</Link>
          </section>
        ) : null}

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
