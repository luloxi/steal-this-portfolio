import type { Locale } from "@/i18n/types";

/**
 * Home Servicios examples. Real things only, no invented clients or metrics.
 * Project previews live in src/content/project-media.ts. Plain words, no stack names, no em dashes.
 */

export type ShowcaseArt = "social" | "whatsapp" | "routines";

export const GROK_BOT_SHOWCASE: { art: ShowcaseArt; copy: Record<Locale, { title: string; body: string }> }[] = [
  {
    art: "social",
    copy: {
      es: { title: "Borradores para redes", body: "Posts para tus redes, con tu tono." },
      en: { title: "Social media drafts", body: "Posts for your social media, in your voice." },
    },
  },
  {
    art: "whatsapp",
    copy: {
      es: { title: "Clientes por WhatsApp", body: "Responde consultas y sigue a tus clientes para que ninguna conversación quede colgada." },
      en: { title: "Clients on WhatsApp", body: "Answers questions and follows up with your clients so no conversation is left hanging." },
    },
  },
  {
    art: "routines",
    copy: {
      es: { title: "Tu asistente 24/7", body: "Boletines sobre lo que te interesa y un asistente que te da una mano con lo que hagas en internet, usando tus propias herramientas." },
      en: { title: "Your 24/7 assistant", body: "Newsletters about what you care about, and an assistant that helps with whatever you do online, using your own tools." },
    },
  },
];
