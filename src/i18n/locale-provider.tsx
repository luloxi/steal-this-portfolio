"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { getMessages, type Messages } from "./messages";
import { applyCopy, type CopyOverrides } from "./copy-overrides";
import { landingCopy, type LandingCopy } from "./landing";
import type { Locale } from "./types";
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY, writePrefCookie } from "@/lib/prefs-shared";
import { localeFromPath, localizePath, switchLocalePath } from "@/lib/routes";

type LocaleContextValue = {
  locale: Locale;
  /** Go to the same page in the other language (and remember the choice). */
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  /** Spanish site path ("/contratar") -> URL in the current language ("/en/hire"). */
  href: (esPath: string) => string;
  t: Messages;
  /** Landing texts (code defaults + saved edits) for the current language. */
  landing: LandingCopy;
  /** Messages for any language with saved edits applied (e.g. to mirror a change in the other one). */
  messagesFor: (locale: Locale) => Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** The selector's memory only: nothing reads it to pick the language (the URL does). */
function remember(locale: Locale) {
  writePrefCookie(LOCALE_COOKIE, locale);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

/**
 * Equivalent URL in the other language. Prefer the page's own hreflang link
 * (it knows the article's other slug); else map the path (proxy 301s fix slugs).
 */
function otherLanguageUrl(to: Locale): string {
  const hreflang = to === "en" ? "en-US" : "es-AR";
  const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
  const { pathname, search, hash } = window.location;
  if (link?.href) {
    try {
      const u = new URL(link.href);
      return u.pathname + search + hash;
    } catch {
      /* fall through */
    }
  }
  return switchLocalePath(pathname, to) + search + hash;
}

/**
 * The language is the URL's: /en/... is English, the rest Spanish. The server
 * renders with it (x-lulox-locale from proxy.ts) and the client reads the same
 * thing from the pathname, so soft navigations between /en pages stay in English.
 */
export function LocaleProvider({
  initialLocale,
  overrides,
  children,
}: {
  initialLocale: Locale;
  /** Admin-edited copy from D1 (server-provided); code messages are the fallback. */
  overrides?: CopyOverrides;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const locale: Locale = pathname ? localeFromPath(pathname) : initialLocale;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      remember(next);
      if (next === locale) return;
      // Full navigation: <html lang>, metadata and server-rendered text all switch together.
      window.location.assign(otherLanguageUrl(next));
    },
    [locale],
  );

  const toggleLocale = useCallback(() => setLocale(locale === "es" ? "en" : "es"), [locale, setLocale]);
  const href = useCallback((esPath: string) => localizePath(locale, esPath), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      href,
      t: applyCopy(getMessages(locale), overrides?.[locale]),
      landing: applyCopy({ landing: landingCopy(locale) }, overrides?.[locale]).landing,
      messagesFor: (l: Locale) => applyCopy(getMessages(l), overrides?.[l]),
    }),
    [locale, setLocale, toggleLocale, href, overrides],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
