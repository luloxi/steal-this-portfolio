import type { Locale } from "@/i18n/types";

/**
 * Case studies (/casos/[slug], /en/case-studies/[slug]) and the "Lo que hacemos con Grok Bot" showcase.
 * Real projects only, no invented clients or metrics. Demo clips live in public/demos and were
 * captured from local or test data (never real accounts). No em dashes.
 */

export type CaseSlug = "genki" | "malito" | "tarask" | "garpen" | "flota-de-bots";

export type CaseCopy = {
  name: string;
  /** One line: what it does and for whom (cards, meta description). */
  tagline: string;
  /** 40 to 60 words, answer-first (top of the case page, quotable). */
  summary: string;
  problem: string;
  solution: string[];
  forWhom: string;
  status: string;
  mediaAlt: string;
};

export type CaseStudy = {
  slug: CaseSlug;
  /** Base name in public/demos (.webm, .mp4, .webp poster). */
  media: string;
  /** D1 project id when the project also lives under /proyectos. */
  projectId?: string;
  icon: string;
  stack: string[];
  live?: string;
  github?: string;
  accent: string;
  copy: Record<Locale, CaseCopy>;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "genki",
    media: "genki",
    icon: "/projects/mochi.png",
    stack: ["Next.js 16", "Cloudflare Workers", "D1", "R2", "IndexedDB", "WebCrypto", "Grok", "Hermes"],
    accent: "var(--section-projects)",
    copy: {
      es: {
        name: "Genki",
        tagline: "Un escritorio con agentes: tus apps en ventanas, Mochi que las maneja, App Market y runners en tus máquinas.",
        summary:
          "Genki es un escritorio en el navegador donde conviven mis apps (Garpen, Tarask, Malito, DjTube y el portfolio) con Mochi, un asistente que abre, ordena y lee las ventanas. Suma un tablero de tareas, un App Market para instalar apps y un panel de runners que corre tareas en tus propias máquinas.",
        problem:
          "Tener cada herramienta en una pestaña distinta hace que la información quede repartida y que el agente no pueda ayudarte con todo junto.",
        solution: [
          "Escritorio con ventanas y un dock, en la compu y en el celular.",
          "Mochi, el asistente, maneja las ventanas y pide aprobación antes de cambiar algo.",
          "App Market para sumar o quitar apps, incluidas apps creativas oficiales.",
          "Runners: una cola de tareas que corre en tus máquinas Windows o Linux, nunca dos veces a la vez.",
          "Tus datos quedan en el dispositivo o en la nube, a elección, con copia de seguridad.",
        ],
        forWhom: "Personas y equipos chicos que quieren sus apps y su agente en un solo lugar.",
        status: "En uso personal. Por ahora es privado.",
        mediaAlt: "Genki en modo local: escritorio, App Market, tablero de tareas y Mochi.",
      },
      en: {
        name: "Genki",
        tagline: "A desktop with agents: your apps in windows, Mochi driving them, an App Market and runners on your machines.",
        summary:
          "Genki is a browser desktop where my apps (Garpen, Tarask, Malito, DjTube and the portfolio) live next to Mochi, an assistant that opens, arranges and reads the windows. It adds a task board, an App Market to install apps and a runners panel that runs tasks on your own machines.",
        problem:
          "With every tool in a different tab, information stays scattered and an agent cannot help you with everything at once.",
        solution: [
          "A desktop with windows and a dock, on computers and phones.",
          "Mochi, the assistant, drives the windows and asks for approval before changing anything.",
          "An App Market to add or remove apps, official creative apps included.",
          "Runners: a task queue that runs on your Windows or Linux machines, never twice at the same time.",
          "Your data stays on the device or in the cloud, your choice, with backups.",
        ],
        forWhom: "People and small teams who want their apps and their agent in one place.",
        status: "In personal use. Private for now.",
        mediaAlt: "Genki in local mode: desktop, App Market, task board and Mochi.",
      },
    },
  },
  {
    slug: "malito",
    media: "malito",
    projectId: "malito",
    icon: "/projects/malito.v5.png",
    stack: ["Next.js", "OpenNext", "Cloudflare Workers", "Email Workers", "D1", "R2", "Resend", "PWA"],
    live: "https://malito.lulox.com.ar",
    accent: "var(--section-contact)",
    copy: {
      es: {
        name: "Malito",
        tagline: "Correo propio y boletín: recibir, leer y mandar mails, y armar campañas para tus listas.",
        summary:
          "Malito es una bandeja de entrada propia que recibe mails con Cloudflare Email Workers, los guarda en D1 y R2 y te deja leer, responder y mandar desde el celular o la compu. Incluye un boletín simple, con listas, campañas, plantillas, vista previa y link de baja en cada mail.",
        problem:
          "Para tener correo con tu dominio y mandar un boletín suele hacer falta pagar varias herramientas que no se hablan entre sí.",
        solution: [
          "Bandeja con recibidos, enviados, borradores, spam y etiquetas.",
          "Contactos sincronizados con Garpen.",
          "Boletín estilo Mailchimp: listas, campañas, plantillas y baja automática.",
          "Instalable como app en el celular.",
        ],
        forWhom: "Profesionales y negocios chicos que quieren su correo y su boletín en un solo lugar.",
        status: "En producción en malito.lulox.com.ar.",
        mediaAlt: "Malito con datos de prueba: bandeja de entrada, lectura de un mail y una campaña del boletín.",
      },
      en: {
        name: "Malito",
        tagline: "Your own email and newsletter: receive, read and send mail, and build campaigns for your lists.",
        summary:
          "Malito is a self-hosted inbox that receives mail through Cloudflare Email Workers, stores it in D1 and R2, and lets you read, reply and send from your phone or computer. It includes a simple newsletter with lists, campaigns, templates, preview and an unsubscribe link in every email.",
        problem:
          "Getting email on your own domain plus a newsletter usually means paying for several tools that do not talk to each other.",
        solution: [
          "Inbox with received, sent, drafts, spam and labels.",
          "Contacts synced with Garpen.",
          "Mailchimp-style newsletter: lists, campaigns, templates and automatic unsubscribe.",
          "Installable as a phone app.",
        ],
        forWhom: "Professionals and small businesses who want their email and newsletter in one place.",
        status: "Live at malito.lulox.com.ar.",
        mediaAlt: "Malito with test data: inbox, reading an email and a newsletter campaign.",
      },
    },
  },
  {
    slug: "tarask",
    media: "tarask",
    projectId: "tarask",
    icon: "/projects/tarask.v3.png",
    stack: ["Next.js", "Cloudflare Workers", "D1", "R2", "Workers AI", "Google OAuth", "PWA"],
    live: "https://tarask.lulox.com.ar",
    github: "https://github.com/luloxi/tarask",
    accent: "var(--section-blog)",
    copy: {
      es: {
        name: "Tarask",
        tagline: "Finanzas personales y del hogar: importás el banco, se categoriza solo y ves en qué se va la plata.",
        summary:
          "Tarask es una app de finanzas personales que importa movimientos del banco o la billetera (Excel o CSV), los categoriza y muestra el mes a mes, la deuda de la tarjeta y los ahorros por moneda (pesos, dólares y USDT). Permite compartir gastos en hogares y leer tickets con IA.",
        problem:
          "Llevar las cuentas a mano en una planilla, con pesos y dólares mezclados, lleva tiempo y casi nunca queda al día.",
        solution: [
          "Importación de resúmenes y movimientos con detección de duplicados.",
          "Categorías automáticas y resumen mensual.",
          "Patrimonio y ahorros por moneda, con su evolución.",
          "Hogares para compartir gastos y tickets leídos con IA.",
        ],
        forWhom: "Personas y hogares que manejan pesos y dólares y quieren ver sus números sin planillas.",
        status: "En producción por invitación en tarask.lulox.com.ar. Código abierto (AGPL).",
        mediaAlt: "Tarask con datos de demostración ficticios: resumen, movimientos y patrimonio.",
      },
      en: {
        name: "Tarask",
        tagline: "Personal and household finances: import your bank, it categorizes itself and you see where the money goes.",
        summary:
          "Tarask is a personal finance app that imports bank or wallet movements (Excel or CSV), categorizes them and shows month by month totals, card debt and savings per currency (pesos, dollars and USDT). It lets households share expenses and reads receipts with AI.",
        problem:
          "Tracking money by hand in a spreadsheet, with pesos and dollars mixed together, takes time and is rarely up to date.",
        solution: [
          "Statement and movement imports with duplicate detection.",
          "Automatic categories and a monthly summary.",
          "Net worth and savings per currency, with their trend.",
          "Households to share expenses and receipts read with AI.",
        ],
        forWhom: "People and households who handle pesos and dollars and want their numbers without spreadsheets.",
        status: "Live by invitation at tarask.lulox.com.ar. Open source (AGPL).",
        mediaAlt: "Tarask with fictional demo data: summary, movements and net worth.",
      },
    },
  },
  {
    slug: "garpen",
    media: "garpen",
    projectId: "garpen",
    icon: "/projects/garpen.v8.png",
    stack: ["Next.js 16", "OpenNext", "Cloudflare Workers", "D1", "Better Auth", "Workers AI", "MCP", "Web Push"],
    live: "https://garpen.lulox.com.ar",
    github: "https://github.com/luloxi/garpen",
    accent: "var(--section-projects)",
    copy: {
      es: {
        name: "Garpen",
        tagline: "Un CRM y ERP a medida: contactos, agenda por urgencia, finanzas, facturas y un agente que lo usa por MCP.",
        summary:
          "Garpen es un CRM y ERP personal hecho a medida: contactos con relaciones (cliente, socio, proveedor), agenda con tareas por urgencia, finanzas con cuentas y movimientos, temporizador facturable y presupuestos. Tiene un endpoint MCP para que un agente como Grok Bot lea y cree tareas y contactos, y cifrado opcional de extremo a extremo.",
        problem:
          "Los CRMs genéricos cobran por funciones que no usás y no se adaptan a cómo trabaja cada persona o equipo.",
        solution: [
          "Contactos con relaciones, foto automática y eventos donde los conociste.",
          "Agenda con colores por urgencia y paso a notas sin fecha.",
          "Finanzas, temporizador facturable, presupuestos y facturas.",
          "Endpoint MCP para agentes y solicitudes del portfolio en una bandeja.",
        ],
        forWhom: "Freelancers y equipos chicos que necesitan un CRM a la medida de su trabajo.",
        status: "En producción en garpen.lulox.com.ar.",
        mediaAlt: "Garpen con una cuenta de prueba local: resumen, contactos, agenda y finanzas.",
      },
      en: {
        name: "Garpen",
        tagline: "A custom CRM and ERP: contacts, urgency-based agenda, finances, invoices and an agent that uses it over MCP.",
        summary:
          "Garpen is a custom personal CRM and ERP: contacts with relations (client, partner, supplier), an agenda with tasks by urgency, finances with accounts and movements, a billable timer and quotes. It has an MCP endpoint so an agent like Grok Bot can read and create tasks and contacts, plus optional end-to-end encryption.",
        problem:
          "Generic CRMs charge for features you do not use and do not adapt to how each person or team works.",
        solution: [
          "Contacts with relations, automatic photos and the events where you met.",
          "Agenda colored by urgency, with undated notes.",
          "Finances, billable timer, quotes and invoices.",
          "MCP endpoint for agents and portfolio inquiries in one inbox.",
        ],
        forWhom: "Freelancers and small teams who need a CRM shaped to their work.",
        status: "Live at garpen.lulox.com.ar.",
        mediaAlt: "Garpen with a local test account: summary, contacts, agenda and finances.",
      },
    },
  },
  {
    slug: "flota-de-bots",
    media: "flota-runners",
    icon: "/projects/lulox.v5.png",
    stack: ["Grok", "Grok Bot", "Hermes", "GitHub", "Cloudflare", "Genki runners", "MCP"],
    accent: "var(--section-hire)",
    copy: {
      es: {
        name: "Flota de bots",
        tagline: "Bots con Grok Bot que programan y publican, ordenan finanzas, guardan links y preparan borradores.",
        summary:
          "La flota es un grupo de bots que armé con Grok Bot como motor principal y Hermes para tareas en mis máquinas. Programan y publican cambios en GitHub y Cloudflare, cargan finanzas, guardan links en marcadores, preparan borradores para redes y WhatsApp, y corren rutinas y recordatorios. Todo envío a terceros lo aprueba una persona.",
        problem:
          "El trabajo repetitivo de todos los días (deploys, cargas, links, borradores, recordatorios) se come horas que podrían ir a decidir y crear.",
        solution: [
          "Bots que construyen y publican código: este sitio se hace así.",
          "Finanzas: leen resúmenes y tickets y los cargan, siempre con aprobación.",
          "Links y notas que terminan en la carpeta correcta de marcadores.",
          "Borradores para X, LinkedIn y WhatsApp que revisás antes de mandar.",
          "Rutinas, recordatorios y una cola de runners propia en Genki.",
        ],
        forWhom: "Personas y equipos que quieren delegar en agentes el trabajo repetitivo sin perder el control.",
        status: "En uso todos los días.",
        mediaAlt: "Panel de runners de Genki con datos de prueba: tareas que pasan de en cola a lista.",
      },
      en: {
        name: "Bot fleet",
        tagline: "Grok Bot agents that write and ship code, sort finances, file links and prepare drafts.",
        summary:
          "The fleet is a group of bots I built with Grok Bot as the main engine and Hermes for tasks on my own machines. They write and ship changes to GitHub and Cloudflare, load finances, file links into bookmarks, prepare drafts for social media and WhatsApp, and run routines and reminders. A person approves every message to third parties.",
        problem:
          "Everyday repetitive work (deploys, data entry, links, drafts, reminders) eats hours that could go to deciding and creating.",
        solution: [
          "Bots that build and ship code: this site is made that way.",
          "Finances: they read statements and receipts and load them, always with approval.",
          "Links and notes that land in the right bookmark folder.",
          "Drafts for X, LinkedIn and WhatsApp that you review before sending.",
          "Routines, reminders and a self-hosted runner queue in Genki.",
        ],
        forWhom: "People and teams who want agents to take over repetitive work without losing control.",
        status: "In daily use.",
        mediaAlt: "Genki runners panel with test data: tasks moving from queued to done.",
      },
    },
  },
];

export const caseBySlug = (slug: string) => CASE_STUDIES.find((c) => c.slug === slug);

export type ShowcaseArt = "code" | "finance" | "bookmarks" | "social" | "whatsapp" | "routines" | "runners";

export const GROK_BOT_SHOWCASE: { art: ShowcaseArt; copy: Record<Locale, { title: string; body: string }> }[] = [
  {
    art: "code",
    copy: {
      es: { title: "Programa y publica", body: "Toma el pedido, arma el cambio en GitHub, corre los tests, abre el PR y publica en Cloudflare. Este sitio se hace así." },
      en: { title: "Writes and ships code", body: "Takes the request, makes the change on GitHub, runs the tests, opens the PR and ships to Cloudflare. This site is built that way." },
    },
  },
  {
    art: "finance",
    copy: {
      es: { title: "Ordena las finanzas", body: "Lee resúmenes del banco y tickets, los carga en Tarask y te cuenta qué cambió. Nada se importa sin tu OK." },
      en: { title: "Sorts your finances", body: "Reads bank statements and receipts, loads them into Tarask and tells you what changed. Nothing is imported without your OK." },
    },
  },
  {
    art: "bookmarks",
    copy: {
      es: { title: "Guarda links en marcadores", body: "Le mandás un link o una nota y lo archiva en la carpeta correcta de tus marcadores, sincronizado con el navegador." },
      en: { title: "Files links into bookmarks", body: "Send it a link or a note and it files it in the right bookmark folder, synced with your browser." },
    },
  },
  {
    art: "social",
    copy: {
      es: { title: "Borradores para redes", body: "Prepara posts para X y LinkedIn con tu tono. Vos los revisás y decidís cuándo salen." },
      en: { title: "Social media drafts", body: "Prepares posts for X and LinkedIn in your voice. You review them and decide when they go out." },
    },
  },
  {
    art: "whatsapp",
    copy: {
      es: { title: "Borradores de WhatsApp", body: "Redacta respuestas y seguimientos para tus contactos. El envío lo hacés vos." },
      en: { title: "WhatsApp drafts", body: "Writes replies and follow-ups for your contacts. You do the sending." },
    },
  },
  {
    art: "routines",
    copy: {
      es: { title: "Rutinas y recordatorios", body: "Resúmenes diarios, recordatorios en el calendario y chequeos que corren solos a la hora que digas." },
      en: { title: "Routines and reminders", body: "Daily digests, calendar reminders and checks that run by themselves at the time you choose." },
    },
  },
  {
    art: "runners",
    copy: {
      es: { title: "Cola de runners propia", body: "Tareas que corren en tus máquinas (Windows o Linux) desde un panel en Genki: en cola, en curso, listas." },
      en: { title: "Your own runner queue", body: "Tasks that run on your machines (Windows or Linux) from a panel in Genki: queued, running, done." },
    },
  },
];
