"use client";

import { useEffect } from "react";

/**
 * Landing reveals for browsers without CSS scroll-driven animations.
 * The CSS path (scroll-motion.css) needs no JS; this only runs where
 * `animation-timeline: view()` is missing. Content is visible by default:
 * only items still below the fold are hidden, and only once JS is running.
 */
export function ScrollRevealFallback() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (CSS.supports?.("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector<HTMLElement>(".hm-landing");
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    for (const el of items) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
    }
    root.classList.add("io-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const el of items) if (!el.classList.contains("is-in")) io.observe(el);
    return () => io.disconnect();
  }, []);
  return null;
}
