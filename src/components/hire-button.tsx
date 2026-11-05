"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";

/**
 * Contratar CTA (home menu and Contacto). No arrow.
 * Light: painted pastel wash locked to the lulox suite palette. Dark: a neon filament with a short glow.
 * Enviar and Contactar reuse `.hire-cta`. The referral submit keeps `.hire-btn`.
 */
export function HireButton({ className = "" }: { className?: string }) {
  const { t, href } = useLocale();
  return (
    <Link href={href("/contratar")} className={`hire-btn hire-cta ${className}`.trim()} data-testid="hire-btn">
      <span className="hire-cta-paint" aria-hidden />
      <span className="hire-btn-label">{t.sections.hire}</span>
    </Link>
  );
}
