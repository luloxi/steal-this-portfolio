"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type ComponentType, type PointerEvent } from "react";
import { HireButton } from "@/components/hire-button";
import { bounce, playLaugh } from "@/components/laugh-button";
import { GitHubIcon, InstagramBrandIcon, LinkedInIcon, TelegramIcon, XIcon } from "@/components/icons/social";
import { useSiteSettings } from "@/components/site-settings-context";
import { homeCopy } from "@/content/home-copy";
import { useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/types";

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
              <Image src={site.heroPhoto} alt={site.name} width={160} height={160} priority draggable={false} />
            </div>
            <p className="hm-intro">{c.intro}</p>
          </div>
          <h1 className="hm-title">{c.title}</h1>
          <p className="hm-lead">{c.lead}</p>
          <div className="hm-cta">
            <HireButton />
          </div>
        </header>

        <section className="hm-section" aria-labelledby="hm-examples">
          <h2 id="hm-examples" className="hm-h2">{c.examples.title}</h2>
          <p className="hm-note">{c.examples.note}</p>
          <ul className="hm-cards">
            {c.examples.items.map((item, i) => (
              <li key={item.title} className="hm-card" style={{ ["--hm-accent" as string]: accents[i % accents.length] }}>
                <h3 className="hm-card-title">{item.title}</h3>
                <p className="hm-card-body">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="hm-section" aria-labelledby="hm-custom">
          <h2 id="hm-custom" className="hm-h2">{c.custom.title}</h2>
          <p className="hm-field">{c.custom.body}</p>
        </section>

        {projects.length ? (
          <section className="hm-section" aria-labelledby="hm-built">
            <h2 id="hm-built" className="hm-h2">{c.built.title}</h2>
            <ul className="hm-projects">
              {projects.map((p, i) => {
                const copy = p.copy[locale] ?? p.copy.es;
                return (
                  <li key={p.id}>
                    <Link
                      href={href(`/proyectos/${p.id}`)}
                      className="cp-row group hm-project"
                      style={{ ["--cp-accent" as string]: accents[i % accents.length] }}
                    >
                      <span className="cp-nav-frame" aria-hidden>
                        <span className="cp-nav-corner cp-nav-corner-tl" />
                        <span className="cp-nav-corner cp-nav-corner-br" />
                      </span>
                      {p.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.icon} alt="" width={56} height={56} className="cp-row-icon project-icon hm-project-icon" />
                      ) : null}
                      <span className="cp-row-body min-w-0">
                        <span className="cp-row-label">{copy.title}</span>
                        <span className="cp-row-detail">{copy.body}</span>
                      </span>
                      <span className="cp-nav-chevron cp-row-chevron" aria-hidden>▸</span>
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
              <li key={step} className="hm-step">
                <span className="hm-step-n" aria-hidden>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="hm-closing">
          <p>{c.closing}</p>
          <div className="hm-cta">
            <HireButton />
          </div>
        </section>
      </main>

      <footer className="hm-footer">
        <nav className="hm-footer-links" aria-label="Social">
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
