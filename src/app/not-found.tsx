import Link from "next/link";
import { getMessages } from "@/i18n/messages";
import { getServerPrefs } from "@/lib/prefs";
import { getSiteSettings } from "@/lib/site-settings-db";

/** Server component so the 404 page is fully in the HTML (no client-only render). */
export default async function NotFound() {
  const [{ locale }, settings] = await Promise.all([getServerPrefs(), getSiteSettings()]);
  const t = getMessages(locale);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 pt-14 text-center">
      <p className="font-mono text-xs text-accent">404</p>
      <p className="mt-2 text-sm text-muted">{t.ui.notFound}</p>
      <Link
        href={locale === "en" ? "/en" : "/"}
        className="mt-6 text-sm text-accent transition-colors hover:text-accent-2"
      >
        ← {settings.name}
      </Link>
    </div>
  );
}
