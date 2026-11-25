import type { Locale } from "@/i18n/types";

/** Contact form copy: what I can build, then a three-field form. No em dashes. */
export const HIRE_COPY = {
  es: {
    lead: "Armo agentes de IA y automatizaciones que se encargan del trabajo repetitivo de tu equipo.",
    canTitle: "Qué puedo hacer",
    can: [
      { icon: "mail", text: "Agentes de IA que leen, ordenan y responden mails y mensajes." },
      { icon: "flow", text: "Automatizaciones que pasan datos entre tus herramientas, sin copiar a mano." },
      { icon: "doc", text: "Lectura de tickets, facturas y documentos para cargarlos solos." },
      { icon: "crm", text: "CRMs y herramientas internas a medida." },
    ],
    tools: "Prefiero trabajar con Grok, Grok Bot y Hermes, y sumo otras herramientas cuando el caso lo pide.",
    formTitle: "Contame qué hace tu equipo a mano",
    form: {
      name: "Nombre",
      email: "Tu email",
      message: "Mensaje",
      ph: "Por ejemplo: todos los días pasamos los pedidos del mail a una planilla…",
      left: "caracteres restantes",
      send: "Enviar",
      sending: "Enviando…",
      ok: "¡Listo! Te respondo a tu email.",
      reply: "Te respondo por email.",
      privacy: "Privacidad",
      call: "¿Preferís hablar? Agendá una videollamada.",
      agents: "Formulario de contacto: nombre, email y mensaje (hasta 1000 caracteres). Para enviarlo hay que pasar la verificación de Cloudflare Turnstile.",
      err: {
        invalid_name: "Falta tu nombre.",
        invalid_email: "Revisá el email.",
        invalid_message: "El mensaje debe tener entre 1 y 1000 caracteres.",
        rate_limited: "Demasiados envíos. Probá en un rato.",
        captcha_failed: "Falta la verificación anti-bots. Esperá el tilde y probá de nuevo.",
        default: "No se pudo enviar. Probá de nuevo.",
      } as Record<string, string>,
    },
  },
  en: {
    lead: "I build AI agents and automations that take care of your team's repetitive work.",
    canTitle: "What I can do",
    can: [
      { icon: "mail", text: "AI agents that read, sort and answer email and messages." },
      { icon: "flow", text: "Automations that move data between your tools, no copying by hand." },
      { icon: "doc", text: "Reading receipts, invoices and documents so they load themselves." },
      { icon: "crm", text: "Custom CRMs and internal tools." },
    ],
    tools: "I prefer working with Grok, Grok Bot and Hermes, and bring in other tools when the case calls for it.",
    formTitle: "Tell me what your team does by hand",
    form: {
      name: "Name",
      email: "Your email",
      message: "Message",
      ph: "For example: every day we copy orders from email into a spreadsheet…",
      left: "characters left",
      send: "Send",
      sending: "Sending…",
      ok: "Done! I'll reply to your email.",
      reply: "I'll reply by email.",
      privacy: "Privacy",
      call: "Rather talk? Book a video call.",
      agents: "Contact form: name, email and message (up to 1000 characters). Sending it requires passing the Cloudflare Turnstile check.",
      err: {
        invalid_name: "Your name is missing.",
        invalid_email: "Check the email.",
        invalid_message: "The message must be 1 to 1000 characters.",
        rate_limited: "Too many sends. Try again later.",
        captcha_failed: "Anti-bot check missing. Wait for the checkmark and try again.",
        default: "Couldn't send. Try again.",
      } as Record<string, string>,
    },
  },
} as const;

export type HireCopy = (typeof HIRE_COPY)[Locale];
