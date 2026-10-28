"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SITE, type SiteSettings } from "@/lib/site-settings";

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE);

/** Identity, socials and colors for this request (D1, or the neutral defaults). */
export function SiteSettingsProvider({ value, children }: { value: SiteSettings; children: ReactNode }) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
