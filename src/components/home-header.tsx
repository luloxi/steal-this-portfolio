"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContactTrigger } from "@/components/contact-modal";

export type HomeNavItem = { label: string; to: string; hire?: boolean };

/**
 * Landing header: sticky, lightly blurred, plain text links (no pills) and one clean
 * Contactar button (style B, same as the form Enviar). In-page anchors light up while their section is on screen.
 * Phones and narrow screens get a menu button with large tap targets.
 * The language/theme/login controls stay in their fixed corner (SiteControls).
 */
export function HomeHeader({ items, label, menuLabel, homeHref }: { items: HomeNavItem[]; label: string; menuLabel: string; homeHref: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const ids = items.filter((i) => i.to.startsWith("#")).map((i) => i.to.slice(1));
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
          else visible.delete(e.target.id);
        }
        // Topmost section currently in the reading band wins.
        const first = els.find((el) => visible.has(el.id));
        setActive(first ? first.id : null);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.01] },
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = items.filter((i) => !i.hire);
  const hire = items.find((i) => i.hire);
  const linkProps = (i: HomeNavItem) => {
    const isActive = i.to === `#${active}`;
    return {
      className: isActive ? "hh-link is-active" : "hh-link",
      "aria-current": isActive ? ("location" as const) : undefined,
      onClick: () => setOpen(false),
    };
  };
  const renderLink = (i: HomeNavItem) =>
    i.to.startsWith("#") ? (
      <a key={i.label} href={i.to} {...linkProps(i)}>{i.label}</a>
    ) : (
      <Link key={i.label} href={i.to} {...linkProps(i)}>{i.label}</Link>
    );

  return (
    <header className={`hh${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`} data-inline-editor="skip">
      <div className="hh-bar">
        <button
          type="button"
          className="hh-menu"
          aria-expanded={open}
          aria-controls="hh-panel"
          aria-label={menuLabel}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden className="hh-menu-icon" />
        </button>
        <Link href={homeHref} className="hh-brand" onClick={() => setOpen(false)}>LULOX</Link>
        <nav className="hh-nav" aria-label={label}>
          {links.map(renderLink)}
          {hire ? <ContactTrigger className="hh-hire" data-testid="header-contact">{hire.label}</ContactTrigger> : null}
        </nav>
      </div>
      <nav id="hh-panel" className="hh-panel" aria-label={label} hidden={!open}>
        {links.map(renderLink)}
        {hire ? <ContactTrigger className="hh-hire" data-testid="header-contact-menu" onOpen={() => setOpen(false)}>{hire.label}</ContactTrigger> : null}
      </nav>
    </header>
  );
}
