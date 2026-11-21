import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site-settings-db";

/** Private or non-content paths: never useful in an index. */
const DISALLOW = ["/rothko", "/blog/nuevo", "/en/blog/nuevo", "/api/", "/auth/", "/admin/"];

/**
 * Search and AI crawlers named explicitly so the welcome is unambiguous
 * (answer engines and generative search can read and cite the public pages).
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "GoogleOther",
  "Applebot-Extended",
  "Bingbot",
  "xAI-Bot",
  "Grok",
  "Meta-ExternalAgent",
  "MistralAI-User",
  "DuckAssistBot",
  "CCBot",
  "Amazonbot",
  "cohere-ai",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${settings.url}/sitemap.xml`,
    host: settings.url,
  };
}
