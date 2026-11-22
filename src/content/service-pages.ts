import type { Locale } from "@/i18n/types";
import type { CaseSlug } from "@/content/showcase";

/**
 * One landing per search intent under /servicios/[slug] (/en/services/[slug], slugs in src/lib/routes.ts).
 * Answer-first copy: the first paragraph and every FAQ answer are 40 to 60 words, quotable as is.
 * Use cases are examples, not client work. No invented metrics. No em dashes.
 */

export type ServicePageCopy = {
  /** Short label for links and breadcrumbs. */
  label: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** H2 phrased as the question people search. */
  question: string;
  answer: string;
  casesTitle: string;
  cases: { title: string; body: string }[];
  howTitle: string;
  how: string[];
  faq: { q: string; a: string }[];
};

export type ServicePage = {
  slug: string;
  related: CaseSlug[];
  copy: Record<Locale, ServicePageCopy>;
};

const HOW_ES = [
  "Me contás qué se hace a mano hoy, con qué herramientas y quién lo hace.",
  "Lo vemos en una llamada corta y te paso una estimación orientativa.",
  "Armo el agente o la automatización, la probamos con tus datos y la ajustamos.",
  "Queda andando, con instrucciones claras y soporte para los primeros cambios.",
];
const HOW_EN = [
  "You tell me what is done by hand today, with which tools and by whom.",
  "We go over it on a short call and I send you a ballpark estimate.",
  "I build the agent or the automation, we test it with your data and tune it.",
  "It stays running, with clear instructions and support for the first changes.",
];

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: "agentes-de-ia",
    related: ["flota-de-bots", "genki", "garpen"],
    copy: {
      es: {
        label: "Agentes de IA para empresas",
        h1: "Agentes de IA para empresas y equipos",
        metaTitle: "Agentes de IA para empresas | Lulox",
        metaDescription: "Armo agentes de IA con Grok, Grok Bot y Hermes que leen, ordenan y cargan información por tu equipo. Remoto desde Buenos Aires, en español e inglés.",
        question: "¿Qué hace un agente de IA en una empresa?",
        answer: "Un agente de IA hace tareas que hoy hace una persona: lee mails y documentos, decide qué corresponde según tus reglas, carga datos en tus sistemas y avisa cuando algo necesita una decisión humana. Los armo con Grok, Grok Bot y Hermes, y siempre con aprobación antes de mandar algo a terceros.",
        casesTitle: "Para qué sirve, con ejemplos",
        cases: [
          { title: "Atención de consultas", body: "Lee lo que entra por mail o formulario, responde lo frecuente y te pasa lo que necesita una persona." },
          { title: "Carga de datos", body: "Pasa la información de mails, PDFs y planillas a tu CRM o sistema, sin copiar a mano." },
          { title: "Seguimiento de clientes", body: "Recuerda a quién hay que escribir, prepara el borrador y lo deja listo para que lo apruebes." },
          { title: "Tareas en tus máquinas", body: "Con Hermes y una cola de runners, corre procesos en tus computadoras sin que estés mirando." },
        ],
        howTitle: "Cómo trabajamos",
        how: HOW_ES,
        faq: [
          { q: "¿Qué diferencia hay entre un agente de IA y un chatbot?", a: "Un chatbot conversa. Un agente de IA además actúa: abre tus herramientas, lee y escribe datos, sigue pasos y vuelve a intentar si algo falla. Por eso conviene que tenga permisos acotados y que las acciones sensibles, como mandar mensajes o mover plata, pasen por tu aprobación antes de ejecutarse." },
          { q: "¿Con qué herramientas armás los agentes?", a: "Uso Grok y Grok Bot como motor principal y Hermes para tareas que corren en tus máquinas. Para conectar herramientas uso lo que mejor encaje, como Gmail, Google Workspace, planillas, CRMs, MCP o n8n, y armo apps propias en Next.js sobre Cloudflare cuando hace falta algo a medida." },
          { q: "¿Mis datos quedan seguros?", a: "El agente solo accede a lo que necesita para su tarea, con cuentas y permisos propios, nunca con tu contraseña personal. Las acciones que afectan a terceros piden aprobación. Si tus datos son sensibles, se puede trabajar con datos de prueba primero y dejar la información real en tus propios sistemas." },
        ],
      },
      en: {
        label: "AI agents for businesses",
        h1: "AI agents for businesses and teams",
        metaTitle: "AI agents for businesses | Lulox",
        metaDescription: "I build AI agents with Grok, Grok Bot and Hermes that read, sort and enter information for your team. Remote from Buenos Aires, in Spanish and English.",
        question: "What does an AI agent do in a business?",
        answer: "An AI agent does tasks a person does today: it reads emails and documents, decides what applies based on your rules, enters data into your systems and flags anything that needs a human decision. I build them with Grok, Grok Bot and Hermes, always with approval before anything goes to third parties.",
        casesTitle: "What it is for, with examples",
        cases: [
          { title: "Handling inquiries", body: "Reads what comes in by email or form, answers the frequent ones and hands you what needs a person." },
          { title: "Data entry", body: "Moves information from emails, PDFs and spreadsheets into your CRM or system, without copying by hand." },
          { title: "Client follow-up", body: "Remembers who needs a message, prepares the draft and leaves it ready for your approval." },
          { title: "Tasks on your machines", body: "With Hermes and a runner queue, it runs processes on your computers while you are not watching." },
        ],
        howTitle: "How we work",
        how: HOW_EN,
        faq: [
          { q: "What is the difference between an AI agent and a chatbot?", a: "A chatbot talks. An AI agent also acts: it opens your tools, reads and writes data, follows steps and retries when something fails. That is why it should have narrow permissions, and sensitive actions like sending messages or moving money should go through your approval before they run." },
          { q: "Which tools do you build agents with?", a: "I use Grok and Grok Bot as the main engine and Hermes for tasks that run on your machines. To connect tools I use whatever fits best, like Gmail, Google Workspace, spreadsheets, CRMs, MCP or n8n, and I build my own Next.js apps on Cloudflare when something custom is needed." },
          { q: "Is my data safe?", a: "The agent only reaches what it needs for its task, with its own accounts and permissions, never with your personal password. Actions that affect third parties ask for approval. If your data is sensitive, we can start with test data and keep the real information inside your own systems." },
        ],
      },
    },
  },
  {
    slug: "automatizacion-de-procesos",
    related: ["flota-de-bots", "malito", "tarask"],
    copy: {
      es: {
        label: "Automatización de procesos",
        h1: "Automatización de procesos con IA",
        metaTitle: "Automatización de procesos con IA | Lulox",
        metaDescription: "Automatizo procesos repetitivos con agentes de IA: mails, planillas, formularios, reportes y avisos. Remoto desde Buenos Aires para Argentina, LATAM y el mundo.",
        question: "¿Qué procesos se pueden automatizar con IA?",
        answer: "Se puede automatizar casi todo lo que se repite y sigue reglas más o menos fijas: clasificar mails, pasar datos entre planillas, formularios y sistemas, armar reportes, leer facturas y mandar avisos. Si alguien de tu equipo hace lo mismo todas las semanas, probablemente un agente con Grok Bot lo pueda hacer.",
        casesTitle: "Ejemplos de procesos",
        cases: [
          { title: "De mail a planilla", body: "Lo que llega por mail se lee, se ordena y queda cargado en la planilla o el sistema que uses." },
          { title: "Reportes que se arman solos", body: "Juntar datos de varias fuentes y mandar el resumen el lunes a la mañana, sin que nadie lo arme." },
          { title: "Avisos a tiempo", body: "Vencimientos, pagos, stock o tareas atrasadas que te avisan por mail o mensaje antes de que sea tarde." },
          { title: "Documentos a partir de datos", body: "Presupuestos, contratos o informes armados desde una plantilla con la información que ya tenés." },
        ],
        howTitle: "Cómo trabajamos",
        how: HOW_ES,
        faq: [
          { q: "¿Cómo sé si un proceso vale la pena automatizarlo?", a: "Conviene cuando se repite seguido, sigue reglas claras y hoy le saca tiempo a alguien de tu equipo. Si además hay errores por copiar a mano, mejor todavía. En la primera llamada lo revisamos juntos y te digo con honestidad si conviene automatizarlo o si es más simple dejarlo como está." },
          { q: "¿Necesito cambiar las herramientas que uso?", a: "No. La idea es conectar lo que ya usás, como Gmail, Google Workspace, Excel, tu CRM o tu sistema de facturación. Solo propongo una herramienta nueva o una app a medida cuando lo que tenés no permite automatizar el proceso de forma confiable." },
          { q: "¿Cuánto cuesta automatizar un proceso?", a: "Depende de qué tan grande sea el proceso y de cuántas herramientas haya que conectar. No hay una lista de precios fija: me contás qué hace tu equipo a mano, lo vemos en una llamada y te paso una estimación. Se paga 50% de anticipo y 50% al entregar." },
        ],
      },
      en: {
        label: "Process automation",
        h1: "Process automation with AI",
        metaTitle: "Process automation with AI | Lulox",
        metaDescription: "I automate repetitive processes with AI agents: email, spreadsheets, forms, reports and alerts. Remote from Buenos Aires for Argentina, LATAM and worldwide.",
        question: "Which processes can be automated with AI?",
        answer: "Almost anything that repeats and follows fairly fixed rules can be automated: sorting emails, moving data between spreadsheets, forms and systems, building reports, reading invoices and sending alerts. If someone on your team does the same thing every week, an agent powered by Grok Bot can probably do it.",
        casesTitle: "Process examples",
        cases: [
          { title: "From email to spreadsheet", body: "What arrives by email gets read, sorted and entered into the spreadsheet or system you use." },
          { title: "Reports that build themselves", body: "Pull data from several sources and send the summary on Monday morning, with nobody putting it together." },
          { title: "Timely alerts", body: "Due dates, payments, stock or late tasks that notify you by email or message before it is too late." },
          { title: "Documents from data", body: "Quotes, contracts or reports generated from a template with the information you already have." },
        ],
        howTitle: "How we work",
        how: HOW_EN,
        faq: [
          { q: "How do I know if a process is worth automating?", a: "It pays off when it repeats often, follows clear rules and takes time away from someone on your team today. Even better if copying by hand causes mistakes. On the first call we review it together and I will tell you honestly whether automating makes sense or whether it is simpler to leave it." },
          { q: "Do I need to change the tools I use?", a: "No. The idea is to connect what you already use, like Gmail, Google Workspace, Excel, your CRM or your invoicing system. I only suggest a new tool or a custom app when what you have does not allow the process to be automated reliably." },
          { q: "How much does it cost to automate a process?", a: "It depends on how big the process is and how many tools need to be connected. There is no fixed price list: you tell me what your team does by hand, we go over it on a call and I send you an estimate. It is 50% upfront and 50% on delivery." },
        ],
      },
    },
  },
  {
    slug: "crm-a-medida",
    related: ["garpen", "malito", "genki"],
    copy: {
      es: {
        label: "CRM a medida",
        h1: "CRM a medida para tu negocio",
        metaTitle: "CRM a medida con agentes de IA | Lulox",
        metaDescription: "Armo CRMs y herramientas internas a medida, con contactos, agenda, seguimiento y finanzas, listos para que un agente de IA los use. Desde Buenos Aires.",
        question: "¿Cuándo conviene un CRM a medida?",
        answer: "Conviene cuando los CRMs genéricos te cobran por funciones que no usás, te obligan a trabajar como ellos quieren o no se conectan con tus herramientas. Un CRM a medida tiene solo lo que tu negocio necesita (contactos, seguimiento, agenda, presupuestos) y puede abrirse a un agente como Grok Bot por MCP.",
        casesTitle: "Qué puede incluir",
        cases: [
          { title: "Contactos y relaciones", body: "Clientes, socios y proveedores, con su historial, notas y en qué estado está cada uno." },
          { title: "Agenda y tareas", body: "Seguimientos con fecha y urgencia, para que nada quede olvidado en un chat." },
          { title: "Presupuestos y finanzas", body: "Presupuestos, facturas, horas facturables y movimientos en el mismo lugar." },
          { title: "Listo para agentes", body: "Un endpoint MCP para que tu agente lea y cree contactos y tareas por vos." },
        ],
        howTitle: "Cómo trabajamos",
        how: HOW_ES,
        faq: [
          { q: "¿Qué ventajas tiene un CRM a medida frente a uno genérico?", a: "Pagás por lo que usás, la pantalla muestra lo que tu equipo necesita y el flujo sigue cómo ya trabajan. Además se conecta con tus herramientas y con agentes de IA sin depender de integraciones pagas. Garpen, mi propio CRM, es un ejemplo real de esa idea." },
          { q: "¿Puedo migrar mis contactos desde Excel o desde otro CRM?", a: "Sí. Se importan desde Excel, CSV o la exportación de tu CRM actual, se revisan duplicados y se ordenan por relación y estado. Antes de mover datos reales se hace una prueba con una copia, para que veas cómo queda todo sin riesgo." },
          { q: "¿Quién es dueño del sistema y de los datos?", a: "Vos. El sistema puede quedar en tu propia cuenta de Cloudflare o en la infraestructura que prefieras, con el código disponible. Así no dependés de mí para seguir usándolo y podés sumar cambios cuando quieras, conmigo o con otra persona." },
        ],
      },
      en: {
        label: "Custom CRM",
        h1: "A custom CRM for your business",
        metaTitle: "Custom CRM with AI agents | Lulox",
        metaDescription: "I build custom CRMs and internal tools with contacts, agenda, follow-up and finances, ready for an AI agent to use. From Buenos Aires.",
        question: "When does a custom CRM make sense?",
        answer: "It makes sense when generic CRMs charge you for features you do not use, force you to work their way or do not connect with your tools. A custom CRM has only what your business needs (contacts, follow-up, agenda, quotes) and can be opened to an agent like Grok Bot over MCP.",
        casesTitle: "What it can include",
        cases: [
          { title: "Contacts and relations", body: "Clients, partners and suppliers, with their history, notes and the status of each one." },
          { title: "Agenda and tasks", body: "Follow-ups with dates and urgency, so nothing gets lost in a chat." },
          { title: "Quotes and finances", body: "Quotes, invoices, billable hours and movements in the same place." },
          { title: "Agent ready", body: "An MCP endpoint so your agent can read and create contacts and tasks for you." },
        ],
        howTitle: "How we work",
        how: HOW_EN,
        faq: [
          { q: "What are the advantages of a custom CRM over a generic one?", a: "You pay for what you use, screens show what your team needs and the flow follows how you already work. It also connects with your tools and with AI agents without paid integrations. Garpen, my own CRM, is a real example of that idea." },
          { q: "Can I migrate my contacts from Excel or another CRM?", a: "Yes. They are imported from Excel, CSV or your current CRM export, duplicates are reviewed and they are sorted by relation and status. Before moving real data we run a test with a copy, so you can see the result without risk." },
          { q: "Who owns the system and the data?", a: "You do. The system can live in your own Cloudflare account or the infrastructure you prefer, with the code available. That way you do not depend on me to keep using it and you can add changes whenever you want, with me or someone else." },
        ],
      },
    },
  },
  {
    slug: "grok-bot",
    related: ["flota-de-bots", "genki", "tarask"],
    copy: {
      es: {
        label: "Automatizar con Grok Bot",
        h1: "Automatizaciones con Grok Bot",
        metaTitle: "Automatizar con Grok Bot | Lulox",
        metaDescription: "Armo y configuro bots con Grok Bot como motor principal: código, finanzas, links, borradores, rutinas y recordatorios. Remoto desde Buenos Aires.",
        question: "¿Qué se puede automatizar con Grok Bot?",
        answer: "Con Grok Bot se pueden armar bots que trabajan solos: programan y publican código, leen y cargan finanzas, guardan links en marcadores, preparan borradores para redes y WhatsApp, y corren rutinas y recordatorios. Yo uso una flota así todos los días, y te ayudo a armar la tuya con permisos claros y aprobación humana.",
        casesTitle: "Bots que ya uso",
        cases: [
          { title: "Desarrollo y deploy", body: "Un bot que arma el cambio, corre tests, abre el PR y publica. Este sitio se hace así." },
          { title: "Finanzas", body: "Lee resúmenes y tickets, los carga en Tarask y pide OK antes de importar." },
          { title: "Links y notas", body: "Lo que le mandás termina en la carpeta correcta de marcadores." },
          { title: "Borradores y rutinas", body: "Posts, mensajes de WhatsApp, resúmenes diarios y recordatorios que revisás antes de que salgan." },
        ],
        howTitle: "Cómo trabajamos",
        how: HOW_ES,
        faq: [
          { q: "¿Qué es Grok Bot?", a: "Grok Bot es un agente que trabaja con Grok y puede usar herramientas: navegar, leer y escribir archivos, conectarse a apps por MCP, correr rutinas y preparar mensajes. Lo uso como motor principal de mis automatizaciones, con reglas escritas para que pida aprobación antes de enviar algo o tocar datos sensibles." },
          { q: "¿Necesito saber programar para usar estos bots?", a: "No. Yo armo los bots, sus reglas y sus conexiones, y te dejo instrucciones simples para pedirles cosas en lenguaje natural. Si querés, también te enseño a ajustar las rutinas vos mismo, para que no dependas de mí para cada cambio chico." },
          { q: "¿Qué pasa si el bot se equivoca?", a: "Por eso las acciones con consecuencias, como mandar un mensaje, publicar o mover plata, pasan por tu aprobación. El bot deja todo como borrador o propuesta, vos lo revisás y recién ahí se ejecuta. Además se guardan copias antes de cambiar datos importantes." },
        ],
      },
      en: {
        label: "Automate with Grok Bot",
        h1: "Automations with Grok Bot",
        metaTitle: "Automate with Grok Bot | Lulox",
        metaDescription: "I build and set up bots with Grok Bot as the main engine: code, finances, links, drafts, routines and reminders. Remote from Buenos Aires.",
        question: "What can you automate with Grok Bot?",
        answer: "With Grok Bot you can build bots that work on their own: they write and ship code, read and load finances, file links into bookmarks, prepare drafts for social media and WhatsApp, and run routines and reminders. I use a fleet like that every day, and I help you build yours with clear permissions and human approval.",
        casesTitle: "Bots I already use",
        cases: [
          { title: "Development and deploys", body: "A bot that makes the change, runs tests, opens the PR and ships. This site is made that way." },
          { title: "Finances", body: "Reads statements and receipts, loads them into Tarask and asks for an OK before importing." },
          { title: "Links and notes", body: "Whatever you send it lands in the right bookmark folder." },
          { title: "Drafts and routines", body: "Posts, WhatsApp messages, daily digests and reminders you review before they go out." },
        ],
        howTitle: "How we work",
        how: HOW_EN,
        faq: [
          { q: "What is Grok Bot?", a: "Grok Bot is an agent that works with Grok and can use tools: browse, read and write files, connect to apps over MCP, run routines and prepare messages. I use it as the main engine of my automations, with written rules so it asks for approval before sending anything or touching sensitive data." },
          { q: "Do I need to code to use these bots?", a: "No. I build the bots, their rules and their connections, and leave you simple instructions to ask them for things in plain language. If you want, I also teach you to adjust the routines yourself, so you do not depend on me for every small change." },
          { q: "What if the bot makes a mistake?", a: "That is why actions with consequences, like sending a message, publishing or moving money, go through your approval. The bot leaves everything as a draft or proposal, you review it and only then it runs. Backups are also taken before important data changes." },
        ],
      },
    },
  },
  {
    slug: "automatizar-whatsapp-y-mail",
    related: ["malito", "flota-de-bots", "garpen"],
    copy: {
      es: {
        label: "Automatizar WhatsApp y mail",
        h1: "Automatizar WhatsApp y mail con IA",
        metaTitle: "Automatizar WhatsApp y mail con IA | Lulox",
        metaDescription: "Agentes de IA que leen, ordenan y responden mails, y preparan borradores de WhatsApp para tus clientes. Vos aprobás antes de enviar. Desde Buenos Aires.",
        question: "¿Cómo se automatizan WhatsApp y el mail con IA?",
        answer: "Un agente lee lo que entra por mail, lo clasifica, responde lo que se repite y te avisa lo urgente. En WhatsApp prepara borradores de respuestas y seguimientos con el contexto de cada cliente, y vos decidís si se mandan. Así el equipo deja de contestar lo mismo todo el día sin perder el trato personal.",
        casesTitle: "Ejemplos",
        cases: [
          { title: "Bandeja ordenada", body: "Mails clasificados por tema y prioridad, con lo urgente arriba y lo demás archivado." },
          { title: "Respuestas frecuentes", body: "Borradores listos para las preguntas de siempre: precios, horarios, turnos o estado de un pedido." },
          { title: "Seguimientos de WhatsApp", body: "El agente recuerda a quién responder y deja el mensaje escrito para que lo mandes." },
          { title: "Boletín propio", body: "Listas y campañas por mail desde tu dominio, como en Malito." },
        ],
        howTitle: "Cómo trabajamos",
        how: HOW_ES,
        faq: [
          { q: "¿El agente manda mensajes solo?", a: "Solo si vos lo decidís. Por defecto deja borradores y vos aprobás cada envío, sobre todo en WhatsApp, donde el trato es más personal. Para avisos internos o respuestas muy repetidas se puede habilitar el envío automático, siempre con reglas claras y un registro de lo que salió." },
          { q: "¿Funciona con mi cuenta de Gmail o con mi dominio?", a: "Sí. Se conecta con Gmail y Google Workspace, o con correo en tu propio dominio. Si querés tu bandeja y tu boletín sin depender de varias herramientas pagas, también puedo armarte una solución como Malito, que recibe y manda desde tu dominio." },
          { q: "¿Qué pasa con la privacidad de mis clientes?", a: "El agente solo lee lo necesario para su tarea y no comparte datos con terceros. Los borradores y la información quedan en tus cuentas. Para empezar se puede probar con mensajes de ejemplo, así ves cómo trabaja antes de darle acceso a conversaciones reales." },
        ],
      },
      en: {
        label: "WhatsApp and email automation",
        h1: "WhatsApp and email automation with AI",
        metaTitle: "WhatsApp and email automation with AI | Lulox",
        metaDescription: "AI agents that read, sort and answer emails, and prepare WhatsApp drafts for your clients. You approve before anything is sent. From Buenos Aires.",
        question: "How do you automate WhatsApp and email with AI?",
        answer: "An agent reads incoming email, sorts it, answers the repetitive ones and flags what is urgent. On WhatsApp it prepares reply and follow-up drafts with each client's context, and you decide whether they go out. Your team stops answering the same thing all day without losing the personal touch.",
        casesTitle: "Examples",
        cases: [
          { title: "A sorted inbox", body: "Emails grouped by topic and priority, with urgent ones on top and the rest archived." },
          { title: "Frequent answers", body: "Drafts ready for the usual questions: prices, hours, bookings or order status." },
          { title: "WhatsApp follow-ups", body: "The agent remembers who to answer and leaves the message written for you to send." },
          { title: "Your own newsletter", body: "Email lists and campaigns from your domain, like in Malito." },
        ],
        howTitle: "How we work",
        how: HOW_EN,
        faq: [
          { q: "Does the agent send messages on its own?", a: "Only if you decide so. By default it leaves drafts and you approve each send, especially on WhatsApp, where the tone is more personal. For internal alerts or very repetitive answers automatic sending can be enabled, always with clear rules and a log of what went out." },
          { q: "Does it work with my Gmail account or my domain?", a: "Yes. It connects with Gmail and Google Workspace, or with email on your own domain. If you want your inbox and newsletter without several paid tools, I can also build something like Malito, which receives and sends from your domain." },
          { q: "What about my clients' privacy?", a: "The agent only reads what it needs for its task and does not share data with third parties. Drafts and information stay in your accounts. To start, we can test with sample messages, so you see how it works before giving it access to real conversations." },
        ],
      },
    },
  },
  {
    slug: "automatizar-finanzas",
    related: ["tarask", "garpen", "flota-de-bots"],
    copy: {
      es: {
        label: "Automatizar finanzas",
        h1: "Automatizar finanzas con IA",
        metaTitle: "Automatizar finanzas con IA | Lulox",
        metaDescription: "Agentes de IA que importan resúmenes del banco, leen tickets y facturas y ordenan tus gastos por categoría, en pesos y dólares. Remoto desde Buenos Aires.",
        question: "¿Cómo se automatizan las finanzas con IA?",
        answer: "Un agente importa los movimientos del banco o la billetera, los categoriza, lee tickets y facturas desde una foto o un PDF y te muestra en qué se va la plata, en pesos y en dólares. Vos revisás y aprobás antes de que se cargue algo. Es lo que hago con Tarask para mis propias cuentas.",
        casesTitle: "Ejemplos",
        cases: [
          { title: "Importar el banco", body: "Resúmenes de Excel, CSV o PDF que se cargan solos, sin duplicados." },
          { title: "Tickets y facturas", body: "Una foto o un PDF que se lee con IA y queda cargado con monto, fecha y categoría." },
          { title: "Pesos y dólares", body: "Ahorros, deuda de tarjeta y patrimonio por moneda, con su evolución mes a mes." },
          { title: "Gastos compartidos", body: "Hogares o equipos que dividen gastos y ven quién le debe a quién." },
        ],
        howTitle: "Cómo trabajamos",
        how: HOW_ES,
        faq: [
          { q: "¿Es seguro darle mis datos financieros a un agente?", a: "El agente no necesita tus claves del banco: trabaja con los resúmenes y archivos que vos exportás. Nada se importa sin tu aprobación y se guardan copias antes de cambiar datos. Para probar se usan datos ficticios, como en la demo de Tarask, antes de tocar información real." },
          { q: "¿Sirve para una empresa o solo para finanzas personales?", a: "Sirve para las dos. En lo personal ordena gastos, ahorros y deudas. En una empresa o un estudio puede cargar facturas de proveedores, conciliar movimientos, avisar vencimientos y armar reportes para quien lleva la contabilidad, sin reemplazar al contador." },
          { q: "¿Funciona con bancos y billeteras de Argentina?", a: "Sí. Tarask ya importa resúmenes de bancos y billeteras argentinas en Excel y CSV, y maneja pesos, dólares y USDT. Para otros bancos se agrega el formato de su exportación. Lo importante es que el banco permita descargar los movimientos." },
        ],
      },
      en: {
        label: "Finance automation",
        h1: "Finance automation with AI",
        metaTitle: "Finance automation with AI | Lulox",
        metaDescription: "AI agents that import bank statements, read receipts and invoices and sort your expenses by category, in pesos and dollars. Remote from Buenos Aires.",
        question: "How do you automate finances with AI?",
        answer: "An agent imports bank or wallet movements, categorizes them, reads receipts and invoices from a photo or a PDF and shows you where the money goes, in pesos and dollars. You review and approve before anything is loaded. That is what I do with Tarask for my own accounts.",
        casesTitle: "Examples",
        cases: [
          { title: "Bank imports", body: "Excel, CSV or PDF statements that load by themselves, without duplicates." },
          { title: "Receipts and invoices", body: "A photo or PDF read with AI and entered with amount, date and category." },
          { title: "Pesos and dollars", body: "Savings, card debt and net worth per currency, with the month by month trend." },
          { title: "Shared expenses", body: "Households or teams that split expenses and see who owes whom." },
        ],
        howTitle: "How we work",
        how: HOW_EN,
        faq: [
          { q: "Is it safe to give my financial data to an agent?", a: "The agent does not need your bank passwords: it works with the statements and files you export. Nothing is imported without your approval and backups are taken before data changes. Testing uses fictional data, like the Tarask demo, before touching real information." },
          { q: "Is it for businesses or only personal finances?", a: "Both. Personally it sorts expenses, savings and debts. In a company or a studio it can load supplier invoices, reconcile movements, flag due dates and build reports for whoever keeps the books, without replacing the accountant." },
          { q: "Does it work with Argentine banks and wallets?", a: "Yes. Tarask already imports statements from Argentine banks and wallets in Excel and CSV, and handles pesos, dollars and USDT. For other banks the export format is added. What matters is that the bank lets you download the movements." },
        ],
      },
    },
  },
];

export const servicePageBySlug = (slug: string) => SERVICE_PAGES.find((p) => p.slug === slug);
