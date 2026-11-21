import type { Locale } from "@/i18n/types";

/** Home landing copy (ES is the source text; EN mirrors it). No em dashes. */
export const HOME_PROJECT_IDS = ["garpen", "tarask", "malito"] as const;

export const homeCopy: Record<Locale, {
  meta: { title: string; description: string; keywords: string[] };
  intro: string;
  title: string;
  lead: string;
  examples: { title: string; note: string; items: { title: string; body: string }[] };
  custom: { title: string; body: string };
  built: { title: string };
  process: { title: string; steps: string[] };
  closing: string;
}> = {
  es: {
    meta: {
      title: "Lulox · Automatización con agentes de IA y n8n",
      description:
        "Automatizo con agentes de IA y n8n el trabajo repetitivo de tu equipo, y armo CRMs y sistemas a medida.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automatización", "agentes de IA", "n8n", "CRM a medida"],
    },
    intro: "Luciano Oliva Bianco, me dicen Lulox",
    title: "Automatizo con agentes de IA y n8n el trabajo repetitivo de tu equipo.",
    lead: "Si hoy eso lo hacen personas, a mano, una y otra vez, lo pasamos a un flujo que lo hace solo.",
    examples: {
      title: "Por ejemplo, este tipo de trabajo",
      note: "Son ejemplos, no trabajos para clientes.",
      items: [
        {
          title: "El correo",
          body: "clasificar mails, armar respuestas que se repiten y avisar cuando llega algo que no puede esperar.",
        },
        {
          title: "Pasar datos de un lado al otro",
          body: "llevar lo que llega en un Excel, un formulario o un mail a un CRM, una agenda o una planilla, sin copiarlo a mano.",
        },
        {
          title: "Tickets, facturas y reportes",
          body: "sacar la información de una foto o un archivo y cargarla, en vez de transcribirla cada vez.",
        },
      ],
    },
    custom: {
      title: "También a medida",
      body: "Armo tu CRM a medida para manejar la relación con tus clientes: contactos, seguimiento, agenda y lo que tu negocio necesite, sin pagar por funciones que no usás. Y otras herramientas internas hechas para cómo trabaja tu equipo.",
    },
    built: { title: "Algunas cosas que ya construí" },
    process: {
      title: "Cómo es trabajar conmigo",
      steps: [
        "Me contás qué hace tu equipo a mano.",
        "Lo vemos en una llamada y sale una estimación orientativa.",
        "50% de anticipo y 50% al entregar.",
      ],
    },
    closing: "Si tenés un proceso que hoy depende de que alguien lo haga a mano, escribime y lo vemos.",
  },
  en: {
    meta: {
      title: "Lulox · Automation with AI agents and n8n",
      description:
        "I automate your team's repetitive work with AI agents and n8n, and build custom CRMs and systems.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automation", "AI agents", "n8n", "custom CRM"],
    },
    intro: "Luciano Oliva Bianco, people call me Lulox",
    title: "I automate your team's repetitive work with AI agents and n8n.",
    lead: "If people do it today, by hand, over and over, we move it to a flow that does it on its own.",
    examples: {
      title: "For example, this kind of work",
      note: "These are examples, not client work.",
      items: [
        {
          title: "Email",
          body: "sort incoming mail, draft the replies you keep writing and flag what can't wait.",
        },
        {
          title: "Moving data around",
          body: "take what arrives in a spreadsheet, a form or an email into a CRM, a calendar or a sheet, without copying it by hand.",
        },
        {
          title: "Receipts, invoices and reports",
          body: "pull the information out of a photo or a file and load it, instead of typing it every time.",
        },
      ],
    },
    custom: {
      title: "Also custom-built",
      body: "I build your own CRM to manage your client relationships: contacts, follow-ups, calendar and whatever your business needs, without paying for features you don't use. Plus other internal tools made for the way your team works.",
    },
    built: { title: "Some things I've already built" },
    process: {
      title: "How working with me goes",
      steps: [
        "You tell me what your team does by hand.",
        "We go over it on a call and you get a rough estimate.",
        "50% upfront and 50% on delivery.",
      ],
    },
    closing: "If you have a process that depends on someone doing it by hand, write to me and we'll look at it.",
  },
};
