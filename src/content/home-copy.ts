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
  examples: { title: string; items: { title: string; body: string }[] };
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
    title: "Tu trabajo, sin la parte aburrida.",
    lead: "Lo que se repite, lo automatizamos con IA.",
    examples: {
      title: "Por ejemplo, este tipo de trabajo",
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
    process: {
      title: "Cómo es trabajar conmigo",
      steps: [
        "Me contás qué hace tu equipo a mano.",
        "Lo charlamos en una llamada y te paso un presupuesto.",
        "50% de anticipo y 50% al entregar.",
      ],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Qué se puede automatizar con agentes de IA?",
          a: "Casi todo lo que se repite y sigue más o menos las mismas reglas: clasificar y responder mails, pasar datos entre planillas, formularios y agendas, leer tickets y facturas desde una foto o un PDF, armar reportes y mandar avisos. Si alguien de tu equipo lo hace a mano una y otra vez, probablemente se pueda automatizar.",
        },
        {
          q: "¿Cuánto cuesta automatizar un proceso?",
          a: "Depende de qué tan grande sea el proceso. Me contás qué hace tu equipo a mano y lo estimamos juntos en una llamada.",
        },
        {
          q: "¿Cómo es el proceso de trabajo?",
          a: "Me contás qué hace tu equipo a mano, lo charlamos en una llamada y te paso un presupuesto. Se paga 50% de anticipo y 50% al entregar.",
        },
        {
          q: "¿Con qué herramientas trabajás?",
          a: "Con las que ya usás: mail, planillas, WhatsApp, tu agenda o tu sistema de clientes. Elijo lo que mejor encaje con tu caso.",
        },
        {
          q: "¿Hacés CRMs y sistemas a medida?",
          a: "Sí. Sistemas de clientes y herramientas internas pensadas para cómo trabaja tu equipo.",
        },
        {
          q: "¿Trabajás de forma remota?",
          a: "Sí. Desde Buenos Aires, con gente de cualquier país, en español o en inglés.",
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
    title: "Your work, without the boring part.",
    lead: "What repeats, we automate with AI.",
    examples: {
      title: "For example, this kind of work",
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
    process: {
      title: "How working with me goes",
      steps: [
        "You tell me what your team does by hand.",
        "We talk it over on a call and I send you a quote.",
        "50% upfront and 50% on delivery.",
      ],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "What can be automated with AI agents?",
          a: "Almost anything that repeats and follows roughly the same rules: sorting and answering email, moving data between spreadsheets, forms and calendars, reading receipts and invoices from a photo or a PDF, building reports and sending alerts. If someone on your team does it by hand over and over, it can probably be automated.",
        },
        {
          q: "How much does it cost to automate a process?",
          a: "It depends on how big the process is. You tell me what your team does by hand and we estimate it together on a call.",
        },
        {
          q: "How does the work go?",
          a: "You tell me what your team does by hand, we talk it over on a call and I send you a quote. Payment is 50% upfront and 50% on delivery.",
        },
        {
          q: "What tools do you work with?",
          a: "The ones you already use: email, spreadsheets, WhatsApp, your calendar or your client system. I pick whatever fits your case best.",
        },
        {
          q: "Do you build custom CRMs and systems?",
          a: "Yes. Client systems and internal tools made for the way your team works.",
        },
        {
          q: "Do you work remotely?",
          a: "Yes. From Buenos Aires, with people in any country, in Spanish or English.",
        },
      ],
    },
    closing: "If you have a process that depends on someone doing it by hand, write to me and we'll look at it.",
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
      body: "Soy Luciano Oliva Bianco, me dicen Lulox. Vivo en Buenos Aires y ayudo a personas y equipos a sacarse de encima el trabajo repetitivo.",
      more: "Leer mi historia",
    },
    showcase: {
      title: "Automatizando procesos",
      lead: "Tareas de todos los días que pueden hacerse solas.",
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
      body: "I'm Luciano Oliva Bianco, people call me Lulox. I live in Buenos Aires and help people and teams get repetitive work off their plate.",
      more: "Read my story",
    },
    showcase: {
      title: "Automating processes",
      lead: "Everyday tasks that can run on their own.",
      cta: "I want something like this",
    },
    services: { title: "Services", lead: "Pick where to start." },
    projects: { title: "Projects" },
    blog: { title: "From the blog", all: "See all posts" },
  },
};
