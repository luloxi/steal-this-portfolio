"use client";

import { CopyText } from "@/components/copy-text";
import { ContactTrigger } from "@/components/contact-modal";
import { useLocale } from "@/i18n/locale-provider";

/**
 * Contactar CTA (home, /servicios and /contacto). No arrow.
 * Style B ("Aro que se enciende") is shared with the header and the form Enviar via `.hire-cta`.
 * Opens the contact modal (message vs video call). Without JS it goes to /contacto.
 * Label: landing.more.nav.hire (code default + D1), same key as the header.
 */
export function HireButton({ className = "" }: { className?: string }) {
  const { landing } = useLocale();
  return (
    <ContactTrigger className={`hire-btn hire-cta ${className}`.trim()} data-testid="hire-btn">
      <span className="hire-btn-label">
        <CopyText copyKey="landing.more.nav.hire" value={landing.more.nav.hire} />
      </span>
    </ContactTrigger>
  );
}
