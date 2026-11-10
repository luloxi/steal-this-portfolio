"use client";

import { useLocale } from "@/i18n/locale-provider";

/** The portfolio site. ?win=portfolio makes this same origin render the landing, not another desktop. */
export function PortfolioWindow() {
  const { locale } = useLocale();
  const src = locale === "en" ? "/en?win=portfolio" : "/?win=portfolio";
  return <iframe className="dk-frame" title="Portfolio" src={src} />;
}
