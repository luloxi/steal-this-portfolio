import type { Locale } from "@/i18n/types";

/**
 * Home Servicios examples. Real things only, no invented clients or metrics.
 * Project previews live in src/content/project-media.ts. Plain words, no stack names, no em dashes.
 */

export type ShowcaseArt = "clients" | "autofill" | "drafts";

export const GROK_BOT_SHOWCASE: { art: ShowcaseArt; copy: Record<Locale, { title: string; body: string }> }[] = [
  {
    art: "clients",
    copy: {
      es: { title: "Cada cliente, al día y sin anotar nada", body: "Notas de tus reuniones que se toman solas, el historial de mails, lo que gastaste y lo que te pagaron. Y si necesitás saber algo, se lo preguntás a un chat con IA." },
      en: { title: "Every client, up to date, without writing anything down", body: "Notes from your meetings that take themselves, the email history, what you spent and what you got paid. And if you need to know something, you ask an AI chat." },
    },
  },
  {
    art: "autofill",
    copy: {
      es: { title: "Lo que hoy cargás a mano, cargado solo", body: "Tickets, planillas, mails o reportes: se arman solos y vos solo revisás y aprobás." },
      en: { title: "What you enter by hand today, entered on its own", body: "Tickets, spreadsheets, emails or reports: they put themselves together and you just review and approve." },
    },
  },
  {
    art: "drafts",
    copy: {
      es: { title: "Tu newsletter y tus redes, listos para aprobar", body: "Los borradores llegan armados con tu tono y no sale nada sin tu OK." },
      en: { title: "Your newsletter and your social media, ready to approve", body: "Drafts arrive ready, in your voice, and nothing goes out without your OK." },
    },
  },
];
