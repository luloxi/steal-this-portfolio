import type { Locale } from "@/i18n/types";

/**
 * Home content: featured projects with a short demo clip (inside the Proyectos section)
 * and the "Automatizando procesos" cards. Real projects only, no invented clients or metrics.
 * Clips live in public/demos and were captured from local or test data (never real accounts).
 * Plain words, no stack names, no em dashes.
 */

export type FeaturedProject = {
  /** Base name in public/demos (.webm, .mp4, .webp poster). */
  media: string;
  /** D1 project id when the project has a page under /proyectos. */
  projectId?: string;
  icon: string;
  accent: string;
  copy: Record<Locale, { name: string; tagline: string; mediaAlt: string }>;
};

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    media: "malito",
    projectId: "malito",
    icon: "/projects/malito.v5.png",
    accent: "var(--section-contact)",
    copy: {
      es: { name: "Malito", tagline: "Herramienta de mail para trabajar: usá tu propia dirección con tu dominio y mandá boletines y campañas a tus listas.", mediaAlt: "Malito con datos de prueba: bandeja de entrada, lectura de un mail y una campaña del boletín." },
      en: { name: "Malito", tagline: "An email tool for work: use your own address on your own domain and send newsletters and campaigns to your lists.", mediaAlt: "Malito with test data: inbox, reading an email and a newsletter campaign." },
    },
  },
  {
    media: "garpen",
    projectId: "garpen",
    icon: "/projects/garpen.v8.png",
    accent: "var(--section-projects)",
    copy: {
      es: { name: "Garpen", tagline: "Un sistema a medida para clientes, agenda, finanzas y facturas, todo en un lugar.", mediaAlt: "Garpen con una cuenta de prueba local: resumen, contactos, agenda y finanzas." },
      en: { name: "Garpen", tagline: "A custom system for clients, calendar, finances and invoices, all in one place.", mediaAlt: "Garpen with a local test account: summary, contacts, agenda and finances." },
    },
  },
];

export type ShowcaseArt = "code" | "bookmarks" | "social" | "whatsapp" | "routines";

export const GROK_BOT_SHOWCASE: { art: ShowcaseArt; copy: Record<Locale, { title: string; body: string }> }[] = [
  {
    art: "code",
    copy: {
      es: { title: "Programa y publica", body: "Toma el pedido, arma el cambio, corre las pruebas, abre el PR, revisa que no haya fallas y publica." },
      en: { title: "Writes and ships code", body: "Takes the request, makes the change, runs the tests, opens the PR, checks for failures and ships." },
    },
  },
  {
    art: "bookmarks",
    copy: {
      es: { title: "Guarda links en marcadores", body: "Le mandás un link o una nota y lo guarda en la carpeta correcta." },
      en: { title: "Files links into bookmarks", body: "Send it a link or a note and it saves it in the right folder." },
    },
  },
  {
    art: "social",
    copy: {
      es: { title: "Borradores para redes", body: "Prepara posts para tus redes, con tu tono." },
      en: { title: "Social media drafts", body: "Prepares posts for your social media, in your voice." },
    },
  },
  {
    art: "whatsapp",
    copy: {
      es: { title: "Trámites y clientes por WhatsApp", body: "Responde consultas, hace seguimiento de clientes y te ayuda con trámites por WhatsApp, para que no se te pase ninguna conversación." },
      en: { title: "Clients and errands on WhatsApp", body: "Answers questions, follows up with clients and helps with errands on WhatsApp, so no conversation slips through." },
    },
  },
  {
    art: "routines",
    copy: {
      es: { title: "Rutinas y recordatorios", body: "Resúmenes diarios, recordatorios y chequeos que corren solos a la hora que digas." },
      en: { title: "Routines and reminders", body: "Daily digests, reminders and checks that run on their own at the time you choose." },
    },
  },
];
