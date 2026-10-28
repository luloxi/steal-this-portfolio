"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { bounce, playLaugh } from "@/components/laugh-button";
import { GitHubIcon } from "@/components/icons/social";
import { SectionNav } from "@/components/section-nav";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";

/**
 * Home is locked to the visible viewport (no page scroll).
 * Mobile: stacked, large photo + name.
 * Desktop: hero photo left, title + links right.
 * Theme/lang controls live in layout (fixed).
 */
export default function HomePage() {
  const { t } = useLocale();
  const site = useSiteSettings();
  const hudRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const touchLaughAt = useRef(0);
  const [glitch, setGlitch] = useState(false);

  // A very short glitch flicker on the name every 6-10 s (off under reduced motion).
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let timer = 0;
    let off = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!mq?.matches && document.visibilityState === "visible") {
          setGlitch(true);
          off = window.setTimeout(() => setGlitch(false), 320);
        }
        schedule();
      }, 6000 + Math.random() * 4000);
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(off);
    };
  }, []);

  // Double tap / double click on the photo: jojojo (soundboard style) + bounce.
  const onPhotoPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return; // mouse uses dblclick
    const now = e.timeStamp;
    const prev = lastTap.current;
    if (prev && now - prev.t < 380 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 40) {
      lastTap.current = null;
      touchLaughAt.current = now;
      laugh();
    } else {
      lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    }
  };
  const laugh = () => {
    playLaugh();
    bounce(hudRef.current, 0.45);
  };

  return (
    <div className="home-root fixed inset-0 z-10 flex flex-col overflow-hidden">
      <main className="home-main">
        <div className="home-layout">
          <div className="home-hero">
            <div
              ref={hudRef}
              className="avatar-hud"
              onPointerDown={onPhotoPointerDown}
              onDoubleClick={(e) => {
                e.preventDefault();
                // Touch browsers may also emit dblclick after our own double-tap.
                if (e.timeStamp - touchLaughAt.current < 700) return;
                laugh();
              }}
            >
              <div className="avatar-hud-photo">
                <Image
                  src={site.heroPhoto}
                  alt={site.name}
                  width={400}
                  height={400}
                  priority
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="home-copy">
            <h1
              className={`home-title neon-text font-display font-semibold uppercase${glitch ? " is-glitch" : ""}`}
              data-text={site.name}
            >
              {site.name}
            </h1>

            <div className="home-sections">
              <SectionNav />
            </div>
          </div>
        </div>
      </main>
      <a className="home-steal" href="https://github.com/luloxi/steal-this-portfolio" target="_blank" rel="noopener noreferrer">
        <GitHubIcon className="home-steal-icon" />
        {t.ui.stealPortfolio}
      </a>
    </div>
  );
}
