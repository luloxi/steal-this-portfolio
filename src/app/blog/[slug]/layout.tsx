import type { Metadata } from "next";
import { localizePost } from "@/content/blog/types";
import { getPublishedPost } from "@/lib/blog";
import { getRequestLocale } from "@/lib/prefs";
import { OG_LOCALE, alternatesFor, excerpt, shareTitle } from "@/lib/page-metadata";
import { getSiteSettings } from "@/lib/site-settings-db";
import { blogPostPath } from "@/lib/routes";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Published only: drafts must not leak their title/summary.
  const post = await getPublishedPost(slug);
  if (!post) {
    return { title: "Blog", robots: { index: false } };
  }
  // Language = URL's: /blog/<slug> es, /en/blog/<slug_en> en (proxy.ts rewrites the latter here).
  const [locale, settings] = await Promise.all([getRequestLocale(), getSiteSettings()]);
  const L = localizePost(post, locale);
  const paths = { es: blogPostPath("es", post), en: blogPostPath("en", post) };
  const url = paths[locale];
  const full = shareTitle(L.title || post.title.es, settings.name);
  const description = L.summary.trim() || excerpt(L.body) || (locale === "es" ? "Artículo." : "Article.");
  const images = [{ url: new URL(post.coverImage || settings.ogImage, settings.url).href }];
  return {
    title: { absolute: full },
    description,
    alternates: await alternatesFor(locale, paths),
    keywords: post.tags,
    openGraph: {
      type: "article",
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[locale === "es" ? "en" : "es"]],
      url: new URL(url, settings.url).href,
      siteName: settings.name,
      title: full,
      description,
      publishedTime: post.publishedAt,
      authors: [settings.legalName],
      tags: post.tags,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: full,
      description,
      images: images.map((i) => i.url),
      creator: settings.xHandle,
      site: settings.xHandle,
    },
  };
}

export default function BlogPostLayout({ children }: Props) {
  return children;
}
