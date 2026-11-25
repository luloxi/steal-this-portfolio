"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CopyText } from "@/components/copy-text";
import { useLocale } from "@/i18n/locale-provider";
import { withUtm } from "@/lib/hire-href";

/**
 * Contactar CTA (home, /servicios and /contacto). No arrow.
 * Style B ("Aro que se enciende") is shared with the header and the form Enviar via `.hire-cta`.
 * The referral submit keeps `.hire-btn` without `.hire-cta`.
 * Label: landing.more.nav.hire (code default + D1), same key as the header.
 * The href is /contratar on the server; after hydration it carries the visit's utm_* params.
 */
const noopSubscribe = () => () => {};

export function HireButton({ className = "" }: { className?: string }) {
  const { href, landing } = useLocale();
  const base = href("/contratar");
  const search = useSyncExternalStore(noopSubscribe, () => window.location.search, () => "");
  const target = withUtm(base, search);
  return (
    <Link href={target} className={`hire-btn hire-cta ${className}`.trim()} data-testid="hire-btn">
      <span className="hire-btn-label">
        <CopyText copyKey="landing.more.nav.hire" value={landing.more.nav.hire} />
      </span>
    </Link>
  );
}
