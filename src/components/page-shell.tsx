"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";

type PageShellProps = {
  title: string;
  /** Hide the section title visually (kept for screen readers), e.g. project detail. */
  hideTitle?: boolean;
  children: ReactNode;
  /** Override top back link (default: home) */
  backHref?: string;
  backLabel?: string;
  /** Override footer CTA (defaults to home CTA) */
  footerHref?: string;
  footerLabel?: string;
  /** Reading layout (article/project detail): wider, unframed text column. */
  reading?: boolean;
};

export function PageShell({
  title,
  hideTitle = false,
  children,
  backHref = "/",
  backLabel,
  footerHref,
  footerLabel,
  reading = false,
}: PageShellProps) {
  const { t, href } = useLocale();
  const settings = useSiteSettings();
  const topLabel = backLabel ?? t.ui.backHome;
  const bottomHref = footerHref ?? backHref;
  const bottomLabel = footerLabel ?? (footerHref || backHref !== "/" ? topLabel : t.ui.backHomeCta);

  return (
    <div className={`cp-shell mx-auto min-h-dvh w-full pb-16 pt-16 sm:pt-20 ${reading ? "cp-shell-reading px-[18px] sm:px-8" : "max-w-xl px-6"}`}>
      {/* Top bar backdrop: page colour fading out, so scrolled content slides under the bar */}
      <div className="cp-topbar-fade" aria-hidden />
      {/* Back link lives in the fixed top bar, opposite the language/theme controls */}
      <div className="cp-topbar-back" data-inline-editor="skip">
        <Link
          href={href(backHref)}
          className="cp-back-link group shrink-0"
          aria-label={`${topLabel} (${settings.name})`}
        >
          <span className="cp-back-chevron" aria-hidden>
            &lt;
          </span>
          <span>{topLabel}</span>
        </Link>
      </div>
      {hideTitle ? (
        <h1 className="sr-only">{title}</h1>
      ) : (
        <header className="cp-shell-header mb-10 flex items-center justify-center">
          <h1 className="cp-page-title cp-page-title-center">
            <span className="cp-page-title-text">{title}</span>
            <span className="cp-page-title-mark" aria-hidden />
          </h1>
        </header>
      )}

      <div>{children}</div>

      <div className="mt-12">
        <Link href={href(bottomHref)} className="cp-back-footer group">
          <span className="cp-nav-frame" aria-hidden>
            <span className="cp-nav-corner cp-nav-corner-tl" />
            <span className="cp-nav-corner cp-nav-corner-br" />
          </span>
          <span className="cp-back-footer-chevron" aria-hidden>
            &lt;
          </span>
          <span className="cp-back-footer-label">{bottomLabel}</span>
        </Link>
      </div>
    </div>
  );
}
