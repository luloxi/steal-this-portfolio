import type { Locale } from "@/i18n/types";

/** Home landing copy (ES is the source text; EN mirrors it). No em dashes. */
/**
 * D1 projects offered on the sales pages (home Proyectos with a demo, /servicios).
 * Personal projects (Tarask, DJ Tube, Mochi...) live only on /proyectos and /sobre-mi.
 */
export const HOME_PROJECT_IDS = ["garpen", "malito"] as const;

export const homeCopy: Record<Locale, {
  meta: { title: string; description: string; keywords: string[] };
  title: string;
  lead: string;
  process: { title: string; steps: string[] };
  faq: { title: string; items: { q: string; a: string }[] };
  closing: string;
  agents: { lead: string; link: string };
  footer: { services: string };
}> = {
  es: {
    meta: {
      title: "Lulox · Automatización con agentes de IA",
      description:
        "Automatizo con agentes de IA el trabajo repetitivo de tu equipo, y armo CRMs y sistemas a medida.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automatización", "agentes de IA", "Grok", "Grok Bot", "Hermes", "CRM a medida"],
    },
    title: "Tu trabajo, sin la parte aburrida.",
    lead: "Lo que se repite, lo automatizamos con IA.",
    process: {
      title: "Cómo es trabajar conmigo",
      steps: [
        "Me contás qué tarea te come horas cada semana.",
        "En una llamada corta vemos si conviene automatizarla y te paso un presupuesto.",
        "La armo con tus herramientas y la probás con tu trabajo real. 50% al empezar, 50% al entregar.",
      ],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Qué se puede automatizar?",
          a: "Lo que se repite con las mismas reglas: ordenar el correo y contestar lo de siempre, pasar lo que llega por mail o formulario a una planilla o una agenda, cargar facturas y tickets desde una foto, armar reportes y avisarte cuando algo no puede esperar. Si alguien lo hace a mano todas las semanas, seguro se puede.",
        },
        {
          q: "¿Cuánto cuesta automatizar un proceso?",
          a: "Depende del tamaño de la tarea. Después de una llamada corta te paso un presupuesto.",
        },
        {
          q: "¿Con qué herramientas trabajás?",
          a: "Con las que ya usás: mail, planillas, WhatsApp, tu agenda o tu sistema de clientes. No tenés que cambiar nada.",
        },
        {
          q: "¿Hacés CRMs y sistemas a medida?",
          a: "Sí. Sistemas de clientes y herramientas internas pensadas para cómo trabaja tu equipo.",
        },
        {
          q: "¿Un agente de IA puede usar lo que armás?",
          a: "Sí. Puedo dejar tu sistema de clientes, tu agenda o tu mail listos para que un agente los use, con permisos acotados y tu aprobación antes de enviar algo.",
        },
        {
          q: "¿Trabajás de forma remota?",
          a: "Sí. Desde Buenos Aires, con gente de cualquier país, en español o en inglés.",
        },
      ],
    },
    closing: "¿Qué tarea te sacarías de encima mañana? Contámela y vemos cómo automatizarla.",
    agents: { lead: "¿Sos un agente de IA y buscás esto para alguien?", link: "Cómo pedir un trabajo" },
    footer: { services: "Servicios" },
  },
  en: {
    meta: {
      title: "Lulox · Automation with AI agents",
      description:
        "I automate your team's repetitive work with AI agents, and build custom CRMs and systems.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automation", "AI agents", "Grok", "Grok Bot", "Hermes", "custom CRM"],
    },
    title: "Your work, without the boring part.",
    lead: "What repeats, we automate with AI.",
    process: {
      title: "How working with me goes",
      steps: [
        "You tell me which task eats hours every week.",
        "On a short call we see if it's worth automating and I send you a quote.",
        "I build it with your tools and you test it on your real work. 50% to start, 50% on delivery.",
      ],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "What can be automated?",
          a: "Anything that repeats with the same rules: sorting email and answering the usual questions, moving what arrives by email or form into a sheet or a calendar, logging invoices and receipts from a photo, building reports and flagging what can't wait. If someone does it by hand every week, it can almost certainly be automated.",
        },
        {
          q: "How much does it cost to automate a process?",
          a: "It depends on the size of the task. After a short call I send you a quote.",
        },
        {
          q: "What tools do you work with?",
          a: "The ones you already use: email, spreadsheets, WhatsApp, your calendar or your client system. You don't have to switch anything.",
        },
        {
          q: "Do you build custom CRMs and systems?",
          a: "Yes. Client systems and internal tools made for the way your team works.",
        },
        {
          q: "Can an AI agent use what you build?",
          a: "Yes. I can set up your client system, calendar or email so an agent can use them, with narrow permissions and your approval before anything goes out.",
        },
        {
          q: "Do you work remotely?",
          a: "Yes. From Buenos Aires, with people in any country, in Spanish or English.",
        },
      ],
    },
    closing: "Which task would you drop tomorrow? Tell me about it and we'll see how to automate it.",
    agents: { lead: "Are you an AI agent looking for this on someone's behalf?", link: "How to request work" },
    footer: { services: "Services" },
  },
};

/** Home sections: header nav, about, automations showcase, cases, services, projects, blog. Plain words, no stack names. */
export const homeMore: Record<Locale, {
  nav: { about: string; showcase: string; services: string; projects: string; blog: string; contact: string; hire: string };
  about: { title: string; body: string; more: string };
  showcase: { title: string; lead: string; cta: string };
  services: { title: string; lead: string };
  projects: { title: string };
  blog: { title: string; all: string };
}> = {
  es: {
    nav: { about: "Sobre mí", showcase: "Automatizando", services: "Servicios", projects: "Proyectos", blog: "Blog", contact: "Contacto", hire: "Contratar" },
    about: {
      title: "Sobre mí",
      body: "Soy Luciano Oliva Bianco, me dicen Lulox. Vivo en Buenos Aires y armo sistemas que hacen el trabajo repetitivo, para que vos te ocupes del resto.",
      more: "Leer mi historia",
    },
    showcase: {
      title: "Lo que ya automatizo",
      lead: "Lo uso todos los días. Te lo armo a vos.",
      cta: "Quiero algo así",
    },
    services: { title: "Servicios", lead: "Elegí por dónde empezar." },
    projects: { title: "Proyectos" },
    blog: { title: "Del blog", all: "Ver todas las notas" },
  },
  en: {
    nav: { about: "About", showcase: "Automating", services: "Services", projects: "Projects", blog: "Blog", contact: "Contact", hire: "Hire me" },
    about: {
      title: "About me",
      body: "I'm Luciano Oliva Bianco, people call me Lulox. I live in Buenos Aires and build systems that do the repetitive work, so you can focus on the rest.",
      more: "Read my story",
    },
    showcase: {
      title: "What I already automate",
      lead: "I use it every day. I can set it up for you.",
      cta: "I want something like this",
    },
    services: { title: "Services", lead: "Pick where to start." },
    projects: { title: "Projects" },
    blog: { title: "From the blog", all: "See all posts" },
  },
};
