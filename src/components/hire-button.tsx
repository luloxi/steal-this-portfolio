"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { withUtm } from "@/lib/hire-href";

/**
 * Contratar CTA (home and Contacto). No arrow.
 * Light: painted pastel wash locked to the lulox suite palette. Dark: a neon filament with a short glow.
 * Enviar and Contactar reuse `.hire-cta`. The referral submit keeps `.hire-btn`.
 * The href is /contratar on the server; after hydration it carries the visit's utm_* params.
 */
const noopSubscribe = () => () => {};

export function HireButton({ className = "" }: { className?: string }) {
  const { t, href } = useLocale();
  const base = href("/contratar");
  const search = useSyncExternalStore(noopSubscribe, () => window.location.search, () => "");
  const target = withUtm(base, search);
  return (
    <Link href={target} className={`hire-btn hire-cta ${className}`.trim()} data-testid="hire-btn">
      <span className="hire-cta-paint" aria-hidden />
      <span className="hire-btn-label">{t.sections.hire}</span>
    </Link>
  );
}
