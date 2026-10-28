"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";

/** Visitors: minimalist link to the admin sign-in, same look as Salir. */
export function LoginLink() {
  const { locale, href } = useLocale();
  const label = locale === "es" ? "Entrar" : "Log in";
  return (
    <Link href={href("/ingresar")} className="cp-logout" data-inline-editor="skip" aria-label={label} title={label}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
