import type { Metadata, Viewport } from "next";
import { Orbitron, Space_Grotesk } from "next/font/google";
import { CosmicBg } from "@/components/cosmic-bg";
import { SiteControls } from "@/components/site-controls";
import { LocaleProvider } from "@/i18n/locale-provider";
import { getRequestLocale, getServerPrefs } from "@/lib/prefs";
import { getCopyOverrides } from "@/lib/site-copy";
import { getViewer } from "@/lib/viewer";
import { AdminProvider } from "@/components/admin-context";
import { SiteOrderProvider } from "@/components/site-order-context";
import { AdminPanel } from "@/components/admin-panel";
import { SiteSettingsProvider } from "@/components/site-settings-context";
import { getSiteOrder } from "@/lib/site-order";
import { PREFS_HEAD_SCRIPT } from "@/lib/prefs-shared";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { buildPageMetadata } from "@/lib/page-metadata";
import { pathPair } from "@/lib/routes";
import { descriptionFor, themeCss } from "@/lib/site-settings";
import { getSiteSettings } from "@/lib/site-settings-db";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

function siteUrl(fallback: string) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const [locale, settings] = await Promise.all([getRequestLocale(), getSiteSettings()]);
  const description = descriptionFor(settings, locale);
  const base: Metadata = {
    metadataBase: new URL(siteUrl(settings.url)),
    title: { default: settings.name, template: `%s | ${settings.name}` },
    description,
    applicationName: settings.name,
    authors: [{ name: settings.legalName, url: settings.url }],
    creator: settings.name,
    keywords: settings.keywords,
    openGraph: {
      type: "website",
      locale: "es_AR",
      alternateLocale: ["en_US"],
      siteName: settings.name,
      title: settings.name,
      description,
      url: "/",
      images: [{ url: new URL(settings.ogImage, settings.url).href, width: 1200, height: 630, alt: settings.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.name,
      description,
      images: [new URL(settings.ogImage, settings.url).href],
      creator: settings.xHandle,
      site: settings.xHandle,
    },
    robots: { index: true, follow: true },
  };
  const home = await buildPageMetadata(locale, pathPair("/"), { title: null, description });
  return { ...base, ...home, title: base.title };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSiteSettings();
  return {
    themeColor: [
      { media: "(prefers-color-scheme: dark)", color: settings.themeColorDark },
      { media: "(prefers-color-scheme: light)", color: settings.themeColorLight },
    ],
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-request: language from the URL (proxy.ts header), theme from its cookie (else dark).
  const [{ locale, theme }, overrides, viewer, order, settings] = await Promise.all([
    getServerPrefs(),
    getCopyOverrides(),
    getViewer(),
    getSiteOrder(),
    getSiteSettings(),
  ]);
  // Admin = allowlisted Google account; any other session is a plain user (referrals only).
  const isAdmin = viewer?.isAdmin === true;
  // Project titles for the admin panel (admin only: visitors never pay for this read).
  let projectLabels: Record<string, { es: string; en: string }> = {};
  if (isAdmin) {
    const { getProjects } = await import("@/lib/projects-db");
    projectLabels = Object.fromEntries(
      (await getProjects()).map((p) => [p.id, { es: p.copy.es.title, en: p.copy.en.title }]),
    );
  }
  return (
    <html
      lang={locale}
      data-ssr-locale={locale}
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${orbitron.variable} ${theme} h-full`}
      style={{ colorScheme: theme === "light" ? "only light" : "dark" }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_HEAD_SCRIPT }} />
      </head>
      <body
        className={`${spaceGrotesk.className} relative min-h-full`}
        suppressHydrationWarning
      >
        <style dangerouslySetInnerHTML={{ __html: themeCss(settings) }} />
        <SiteSettingsProvider value={settings}>
          <ThemeProvider initialTheme={theme}>
            <LocaleProvider initialLocale={locale} overrides={overrides}>
              <CosmicBg />
              <AdminProvider isAdmin={isAdmin} signedIn={Boolean(viewer)}>
                <SiteControls signedIn={Boolean(viewer)} image={viewer?.image} name={viewer?.name} />
                <SiteOrderProvider initial={order}>
                  <div className="relative z-10">{children}</div>
                  {isAdmin ? <AdminPanel projectLabels={projectLabels} /> : null}
                </SiteOrderProvider>
              </AdminProvider>
            </LocaleProvider>
          </ThemeProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
