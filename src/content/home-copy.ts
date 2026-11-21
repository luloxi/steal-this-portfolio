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
  faq: { title: string; items: { q: string; a: string }[] };
  closing: string;
  footer: { services: string };
}> = {
  es: {
    meta: {
      title: "Lulox · Automatización con agentes de IA",
      description:
        "Automatizo con agentes de IA el trabajo repetitivo de tu equipo, y armo CRMs y sistemas a medida.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automatización", "agentes de IA", "Grok", "Grok Bot", "Hermes", "CRM a medida"],
    },
    intro: "Luciano Oliva Bianco, me dicen Lulox",
    title: "Automatizo con agentes de IA el trabajo repetitivo de tu equipo.",
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
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Qué se puede automatizar con agentes de IA?",
          a: "Casi todo lo que se repite y sigue más o menos las mismas reglas: clasificar y responder mails, pasar datos entre Excel, formularios, CRMs y agendas, leer tickets y facturas desde una foto o un PDF, armar reportes y mandar avisos. Si alguien de tu equipo lo hace a mano una y otra vez, probablemente se pueda automatizar.",
        },
        {
          q: "¿Cuánto cuesta automatizar un proceso?",
          a: "Depende de qué tan grande sea el proceso. Me contás qué hace tu equipo a mano y lo estimamos juntos en una llamada.",
        },
        {
          q: "¿Cómo es el proceso de trabajo?",
          a: "Me contás qué hace tu equipo a mano, lo vemos en una llamada y sale una estimación orientativa. Se paga 50% de anticipo y 50% al entregar.",
        },
        {
          q: "¿Con qué herramientas trabajás?",
          a: "Para los agentes de IA prefiero Grok, Grok Bot y Hermes. Para conectar herramientas uso lo que mejor encaje con tu caso, n8n incluido.",
        },
        {
          q: "¿Hacés CRMs y sistemas a medida?",
          a: "Sí. Armo CRMs y herramientas internas pensadas para cómo trabaja tu equipo. Por ejemplo Garpen, mi propio sistema con contactos, agenda, finanzas y temporizador facturable.",
        },
        {
          q: "¿Trabajás de forma remota?",
          a: "Sí. Trabajo remoto desde Argentina, en español o en inglés.",
        },
      ],
    },
    closing: "Si tenés un proceso que hoy depende de que alguien lo haga a mano, escribime y lo vemos.",
    footer: { services: "Servicios" },
  },
  en: {
    meta: {
      title: "Lulox · Automation with AI agents",
      description:
        "I automate your team's repetitive work with AI agents, and build custom CRMs and systems.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automation", "AI agents", "Grok", "Grok Bot", "Hermes", "custom CRM"],
    },
    intro: "Luciano Oliva Bianco, people call me Lulox",
    title: "I automate your team's repetitive work with AI agents.",
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
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "What can be automated with AI agents?",
          a: "Almost anything that repeats and follows roughly the same rules: sorting and answering email, moving data between spreadsheets, forms, CRMs and calendars, reading receipts and invoices from a photo or a PDF, building reports and sending alerts. If someone on your team does it by hand over and over, it can probably be automated.",
        },
        {
          q: "How much does it cost to automate a process?",
          a: "It depends on how big the process is. You tell me what your team does by hand and we estimate it together on a call.",
        },
        {
          q: "How does the work go?",
          a: "You tell me what your team does by hand, we go over it on a call and you get a rough estimate. Payment is 50% upfront and 50% on delivery.",
        },
        {
          q: "What tools do you work with?",
          a: "For AI agents I prefer Grok, Grok Bot and Hermes. To connect tools I use whatever fits your case best, n8n included.",
        },
        {
          q: "Do you build custom CRMs and systems?",
          a: "Yes. I build CRMs and internal tools made for the way your team works. For example Garpen, my own system with contacts, calendar, finances and a billable timer.",
        },
        {
          q: "Do you work remotely?",
          a: "Yes. I work remotely from Argentina, in Spanish or English.",
        },
      ],
    },
    closing: "If you have a process that depends on someone doing it by hand, write to me and we'll look at it.",
    footer: { services: "Services" },
  },
};
