import { homeCopy, homeMore } from "@/content/home-copy";
import { GROK_BOT_SHOWCASE } from "@/content/showcase";
import type { Locale } from "./types";

/**
 * Landing texts the owner can edit in place (edit mode). They live in code
 * (src/content/home-copy.ts, showcase.ts) and those values are the fallback;
 * D1 site_copy rows under "landing.*" override them per locale.
 * SEO meta (title, description, keywords) stays in code on purpose.
 */
export function landingCopy(locale: Locale) {
  const { meta: _meta, ...home } = homeCopy[locale];
  return {
    home,
    more: homeMore[locale],
    cases: GROK_BOT_SHOWCASE.map((item) => ({ ...item.copy[locale] })),
  };
}

export type LandingCopy = ReturnType<typeof landingCopy>;
