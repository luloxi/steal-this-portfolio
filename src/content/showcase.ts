import type { Locale } from "@/i18n/types";

/**
 * Home Servicios examples. Real things only, no invented clients or metrics.
 * Project previews live in src/content/project-media.ts. Plain words, no stack names, no em dashes.
 */

export type ShowcaseArt = "clients" | "autofill" | "newsletters";

export const GROK_BOT_SHOWCASE: { art: ShowcaseArt; copy: Record<Locale, { title: string; body: string }> }[] = [
  {
    art: "clients",
    copy: {
      es: { title: "Cada cliente, al día y sin anotar nada", body: "Notas de tus reuniones que se toman solas, el historial de mails y chats de otras redes, lo que gastaste y lo que te pagaron. Y si necesitás saber algo, se lo preguntás a un chat con IA." },
      en: { title: "Every client, up to date, without writing anything down", body: "Notes from your meetings that take themselves, the history of emails and chats from other platforms, what you spent and what you got paid. And if you need to know something, you ask an AI chat." },
    },
  },
  {
    art: "autofill",
    copy: {
      es: { title: "Dejá de cargar datos a mano", body: "Tickets, planillas, mails o reportes se cargan solos. Vos solo revisás que esté bien." },
      en: { title: "Stop entering data by hand", body: "Tickets, spreadsheets, emails or reports get entered on their own. You just check that it's right." },
    },
  },
  {
    art: "newsletters",
    copy: {
      es: { title: "Boletines a tu medida, del trabajo y de tu vida", body: "Te llegan novedades de tu rubro y también planes para salir en tu zona, viajes que te pueden interesar o lo nuevo de los artistas que seguís." },
      en: { title: "Newsletters made for you, about work and your life", body: "You get news from your field, plus plans to go out in your area, trips you might like, or what's new from the artists you follow." },
    },
  },
];
