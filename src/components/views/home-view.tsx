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
import { homeCopy } from "@/content/home-copy";
import { useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/types";
import { thumb } from "@/lib/thumbs";

export type HomeProject = {
  id: string;
  icon: string;
  copy: Record<Locale, { title: string; body: string }>;
};

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
export function HomeView({ projects }: { projects: HomeProject[] }) {
  const { t, href, locale } = useLocale();
  const site = useSiteSettings();
  const c = homeCopy[locale];
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

        {projects.length ? (
          <section className="hm-section" aria-labelledby="hm-built">
            <h2 id="hm-built" className="hm-h2">{c.built.title}</h2>
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
