import type { Locale } from "@/i18n/types";

/** /servicios (/en/services). Use cases are examples, not client work. No em dashes. */
export type ServicesCopy = {
  meta: { title: string; description: string };
  title: string;
  intro: string;
  useCases: { title: string; note: string; items: { title: string; body: string }[] };
  custom: { title: string; body: string; projectsLabel: string };
  stack: { title: string; body: string };
  n8n: { title: string; body: string };
  process: { title: string; steps: string[] };
  closing: string;
  offers: { name: string; description: string }[];
};

export const servicesCopy: Record<Locale, ServicesCopy> = {
  es: {
    meta: {
      title: "Servicios de automatización con agentes de IA y n8n",
      description:
        "Qué puedo automatizar con agentes de IA y n8n: correo, carga de datos, CRM, facturas, reportes y agenda. También CRMs y herramientas internas a medida.",
    },
    title: "Automatización con agentes de IA y n8n",
    intro:
      "Tomo el trabajo que tu equipo hace a mano, una y otra vez, y lo paso a flujos que corren solos. n8n conecta las herramientas que ya usás y los agentes de IA se encargan de la parte que antes necesitaba a una persona: leer, clasificar, resumir y redactar.",
    useCases: {
      title: "Qué se puede automatizar",
      note: "Son ejemplos de lo que se puede hacer, no trabajos para clientes.",
      items: [
        {
          title: "Correo y atención",
          body: "Clasificar los mails que llegan, preparar borradores de las respuestas que se repiten y avisar por chat cuando entra algo urgente.",
        },
        {
          title: "Ventas y CRM",
          body: "Llevar cada consulta de un formulario, un mail o una planilla al CRM, asignarla y programar el seguimiento para que nadie quede sin respuesta.",
        },
        {
          title: "Facturas, tickets y comprobantes",
          body: "Leer los datos de una foto o un PDF (fecha, monto, proveedor) y cargarlos en la planilla o el sistema que uses.",
        },
        {
          title: "Reportes y resúmenes",
          body: "Juntar los números de varias planillas o sistemas y mandar un resumen diario o semanal por mail o chat.",
        },
        {
          title: "Agenda y recordatorios",
          body: "Confirmar turnos, mandar recordatorios y mover a la agenda lo que llega por otros canales.",
        },
        {
          title: "Documentos",
          body: "Armar presupuestos, contratos o informes a partir de una plantilla y los datos que ya tenés.",
        },
      ],
    },
    custom: {
      title: "CRMs y herramientas a medida",
      body: "Cuando una herramienta genérica no alcanza o cobra por funciones que no usás, armo un sistema a medida: contactos, seguimiento, agenda, finanzas o lo que tu negocio necesite. Estos son algunos que ya construí y uso:",
      projectsLabel: "Proyectos",
    },
    stack: {
      title: "Con qué trabajo",
      body: "n8n para los flujos, modelos de lenguaje como agentes, Google Workspace, Gmail y planillas, y aplicaciones web propias en Next.js sobre Cloudflare cuando hace falta algo a medida.",
    },
    n8n: {
      title: "¿Por qué n8n?",
      body: "n8n arma flujos que conectan cientos de aplicaciones sin escribir todo desde cero, y se puede alojar en un servidor propio, así los datos quedan bajo tu control. Cuando un paso necesita criterio, un agente de IA lo resuelve dentro del mismo flujo.",
    },
    process: {
      title: "Cómo es trabajar conmigo",
      steps: [
        "Me contás qué hace tu equipo a mano.",
        "Lo vemos en una llamada y sale una estimación orientativa.",
        "50% de anticipo y 50% al entregar.",
      ],
    },
    closing: "Si tenés un proceso que hoy depende de que alguien lo haga a mano, escribime y lo vemos.",
    offers: [
      {
        name: "Automatización con agentes de IA",
        description: "Agentes de IA que leen, clasifican, resumen y redactan dentro de los procesos de tu equipo.",
      },
      {
        name: "Flujos de automatización con n8n",
        description: "Flujos en n8n que conectan correo, planillas, formularios, CRMs y agendas para que el trabajo repetitivo corra solo.",
      },
      {
        name: "CRM a medida",
        description: "Un CRM hecho para tu negocio: contactos, seguimiento, agenda y lo que necesites, sin pagar por funciones que no usás.",
      },
      {
        name: "Herramientas internas a medida",
        description: "Sistemas internos hechos para cómo trabaja tu equipo.",
      },
    ],
  },
  en: {
    meta: {
      title: "Automation services with AI agents and n8n",
      description:
        "What I can automate with AI agents and n8n: email, data entry, CRM, invoices, reports and scheduling. Plus custom CRMs and internal tools.",
    },
    title: "Automation with AI agents and n8n",
    intro:
      "I take the work your team does by hand, over and over, and move it to flows that run on their own. n8n connects the tools you already use and AI agents handle the part that used to need a person: reading, sorting, summarizing and writing.",
    useCases: {
      title: "What can be automated",
      note: "These are examples of what can be done, not client work.",
      items: [
        {
          title: "Email and support",
          body: "Sort incoming email, draft the replies you keep writing and send a chat alert when something urgent arrives.",
        },
        {
          title: "Sales and CRM",
          body: "Bring every inquiry from a form, an email or a sheet into the CRM, assign it and schedule the follow-up so nobody goes unanswered.",
        },
        {
          title: "Invoices, receipts and tickets",
          body: "Read the data from a photo or a PDF (date, amount, vendor) and load it into the sheet or system you use.",
        },
        {
          title: "Reports and summaries",
          body: "Gather numbers from several sheets or systems and send a daily or weekly summary by email or chat.",
        },
        {
          title: "Scheduling and reminders",
          body: "Confirm appointments, send reminders and move what arrives on other channels into the calendar.",
        },
        {
          title: "Documents",
          body: "Build quotes, contracts or reports from a template and the data you already have.",
        },
      ],
    },
    custom: {
      title: "Custom CRMs and tools",
      body: "When a generic tool falls short or charges for features you don't use, I build a custom system: contacts, follow-ups, calendar, finances or whatever your business needs. These are some I've already built and use:",
      projectsLabel: "Projects",
    },
    stack: {
      title: "What I work with",
      body: "n8n for the flows, language models as agents, Google Workspace, Gmail and sheets, and my own web apps in Next.js on Cloudflare when something custom is needed.",
    },
    n8n: {
      title: "Why n8n?",
      body: "n8n builds flows that connect hundreds of apps without writing everything from scratch, and it can run on your own server, so the data stays under your control. When a step needs judgment, an AI agent handles it inside the same flow.",
    },
    process: {
      title: "How working with me goes",
      steps: [
        "You tell me what your team does by hand.",
        "We go over it on a call and you get a rough estimate.",
        "50% upfront and 50% on delivery.",
      ],
    },
    closing: "If you have a process that depends on someone doing it by hand, write to me and we'll look at it.",
    offers: [
      {
        name: "Automation with AI agents",
        description: "AI agents that read, sort, summarize and write inside your team's processes.",
      },
      {
        name: "n8n automation workflows",
        description: "n8n flows that connect email, sheets, forms, CRMs and calendars so repetitive work runs on its own.",
      },
      {
        name: "Custom CRM",
        description: "A CRM made for your business: contacts, follow-ups, calendar and whatever you need, without paying for features you don't use.",
      },
      {
        name: "Custom internal tools",
        description: "Internal systems made for the way your team works.",
      },
    ],
  },
};
