import type { Locale } from "@/i18n/types";

/** /servicios (/en/services). Use cases are examples, not client work. No em dashes. */
export type ServicesCopy = {
  meta: { title: string; description: string };
  title: string;
  intro: string;
  useCases: { title: string; note: string; items: { title: string; body: string }[] };
  custom: { title: string; body: string; projectsLabel: string };
  stack: { title: string; body: string };
  process: { title: string; steps: string[] };
  closing: string;
  offers: { name: string; description: string }[];
};

export const servicesCopy: Record<Locale, ServicesCopy> = {
  es: {
    meta: {
      title: "Servicios de automatización con agentes de IA",
      description:
        "Para independientes y freelancers: diagnóstico, decisión y armado. Automatizo correo, carga de datos, facturas, reportes y agenda con IA. También CRMs a medida.",
    },
    title: "Servicios",
    intro:
      "Para independientes y freelancers. Encuentro dónde se traba tu trabajo, decido qué conviene y lo automatizo con tus herramientas. La IA se encarga de lo que antes hacías a mano: leer, ordenar, resumir y redactar.",
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
      body: "Con las que ya usás: mail, planillas, WhatsApp, tu agenda o tu sistema de clientes. Si hace falta algo a medida, lo armo.",
    },
    process: {
      title: "Cómo es trabajar conmigo",
      steps: [
        "Diagnóstico: una charla para encontrar dónde se traba tu trabajo.",
        "Decisión: qué conviene resolver y cómo, con un presupuesto.",
        "Armado: lo dejo andando con tus herramientas. 50% al empezar y 50% al entregar.",
      ],
    },
    closing: "¿Qué tarea te sacarías de encima mañana? Contámela y vemos cómo automatizarla.",
    offers: [
      {
        name: "Diagnóstico y decisión",
        description: "Una charla para encontrar dónde se traba tu trabajo, decidir qué conviene resolver y cómo, y pasarte un presupuesto.",
      },
      {
        name: "Automatización con IA",
        description: "Automatizaciones que leen, ordenan, resumen y redactan dentro de tu trabajo, con las herramientas que ya usás.",
      },
      {
        name: "Automatizaciones entre herramientas",
        description: "Flujos que conectan correo, planillas, formularios, CRMs y agendas para que el trabajo repetitivo corra solo.",
      },
      {
        name: "CRM a medida",
        description: "Un CRM hecho para tu negocio: contactos, seguimiento, agenda y lo que necesites, sin pagar por funciones que no usás.",
      },
      {
        name: "Herramientas internas a medida",
        description: "Sistemas hechos para cómo trabajás.",
      },
      {
        name: "Sistemas listos para agentes de IA",
        description: "Tu CRM, tu agenda o tu mail preparados para que un agente de IA los use, con permisos acotados y tu aprobación antes de enviar.",
      },
    ],
  },
  en: {
    meta: {
      title: "Automation services with AI agents",
      description:
        "For freelancers and independent professionals: diagnosis, decision and build. I automate email, data entry, invoices, reports and scheduling with AI. Plus custom CRMs.",
    },
    title: "Services",
    intro:
      "For freelancers and independent professionals. I find where your work gets stuck, decide what's worth doing and automate it with your tools. AI handles what you used to do by hand: reading, sorting, summarizing and writing.",
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
      body: "The ones you already use: email, spreadsheets, WhatsApp, your calendar or your client system. If something custom is needed, I build it.",
    },
    process: {
      title: "How working with me goes",
      steps: [
        "Diagnosis: a chat to find where your work gets stuck.",
        "Decision: what's worth solving and how, with a quote.",
        "Build: I set it up with your tools. 50% to start and 50% on delivery.",
      ],
    },
    closing: "Which task would you drop tomorrow? Tell me about it and we'll see how to automate it.",
    offers: [
      {
        name: "Diagnosis and decision",
        description: "A chat to find where your work gets stuck, decide what's worth solving and how, and send you a quote.",
      },
      {
        name: "Automation with AI",
        description: "Automations that read, sort, summarize and write inside your work, with the tools you already use.",
      },
      {
        name: "Automations between tools",
        description: "Flows that connect email, sheets, forms, CRMs and calendars so repetitive work runs on its own.",
      },
      {
        name: "Custom CRM",
        description: "A CRM made for your business: contacts, follow-ups, calendar and whatever you need, without paying for features you don't use.",
      },
      {
        name: "Custom internal tools",
        description: "Systems made for the way you work.",
      },
      {
        name: "Systems your AI agents can use",
        description: "Your CRM, calendar or email set up so an AI agent can use them, with narrow permissions and your approval before anything goes out.",
      },
    ],
  },
};
