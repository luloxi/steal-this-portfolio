import type { Locale } from "@/i18n/types";

/**
 * Home landing copy (ES is the source text; EN mirrors it). No em dashes, no stack names.
 * Audience: owners of small businesses (firms, agencies, consultancies, shops).
 * Message: the repetitive work runs on its own, and nothing goes out without your OK.
 * Every string here is editable in place (edit mode, D1 site_copy "landing.home.*").
 */
/**
 * D1 projects offered on the sales pages (home Proyectos with a demo, /servicios).
 * Personal projects (Tarask, DJ Tube, Mochi...) live only on /proyectos and /sobre-mi.
 */
export const HOME_PROJECT_IDS = ["garpen", "malito"] as const;

/** Which mini screen illustrates each "Cosas que ya armé" item (test data only). */
export type BuiltArt = "receipt" | "summary" | "outings" | "garpen" | "malito" | "agents";
export const BUILT_ART: readonly BuiltArt[] = ["receipt", "summary", "outings", "garpen", "malito", "agents"];

type HomeCopy = {
  meta: { title: string; description: string; keywords: string[] };
  kicker: string;
  title: string;
  lead: string;
  cta: string;
  cta2: string;
  checks: string[];
  flow: { inputs: string[]; core: string; human: string; outputs: string[] };
  problem: { title: string; body: string };
  cases: {
    title: string;
    note: string;
    problemLabel: string;
    recipe: string;
    items: { problem: string; solves: string; flow: string[] }[];
  };
  trust: { title: string; items: string[] };
  built: { title: string; note: string; items: { lead: string; title: string; detail: string }[] };
  process: { title: string; steps: { title: string; body: string }[]; pay: string };
  faq: { title: string; items: { q: string; a: string }[] };
  closing: { title: string; body: string; cta: string };
  agents: { lead: string; link: string };
  footer: { services: string };
};

/** Index of the step in each case flow where the person decides (shown in violet). */
export const CASE_HUMAN_STEP = [3, 2, 2, 2] as const;

export const homeCopy: Record<Locale, HomeCopy> = {
  es: {
    meta: {
      title: "Lulox · Consultor en automatización con IA",
      description: "Dejá de hacer a mano el trabajo repetitivo. Simplifiquemos tus flujos de trabajo con IA.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automatización", "automatización con IA", "negocios chicos", "automatizar tareas", "IA", "CRM a medida"],
    },
    kicker: "Automatización con IA para negocios chicos",
    title: "Que el trabajo repetitivo de tu negocio se haga solo.",
    lead: "Para estudios, inmobiliarias, consultoras y comercios con poco equipo. Sin abrir otra app, sin copiar y pegar, sin tener que acordarte.",
    cta: "Contame qué te saca tiempo",
    cta2: "Ver qué hace solo",
    checks: ["Te respondo en el día", "Con las herramientas que ya usás", "Nada sale sin tu OK"],
    flow: {
      inputs: ["Reunión", "Mail", "Ticket"],
      core: "LULOX",
      human: "Vos revisás",
      outputs: ["Ficha del cliente", "Recordatorio", "Resumen del lunes"],
    },
    problem: {
      title: "Ya sabés que la IA lee una foto o resume un texto.",
      body: "Pero alguien igual tiene que abrir la app, copiar, pegar y acordarse de hacerlo todas las semanas. Lo que armo hace todo el recorrido solo: toma el dato donde aparece, lo procesa y lo deja donde lo necesitás. Vos solo revisás.",
    },
    cases: {
      title: "Qué hace solo",
      note: "En violeta, el paso donde decidís vos.",
      problemLabel: "El problema",
      recipe: "Llevate la receta gratis",
      items: [
        {
          problem: "Salís de una reunión y lo que quedó pendiente se pierde.",
          solves: "Las notas se toman solas y van a la ficha del cliente, junto al historial de mails y chats de otras redes. Te llega un recordatorio de cada pendiente, y si necesitás saber algo de ese cliente, se lo preguntás a un chat con IA.",
          flow: ["Reunión", "Notas solas", "Ficha del cliente", "Recordatorio para vos"],
        },
        {
          problem: "No tenés claro quién te debe ni cuánto te costó cada cliente.",
          solves: "Tickets, facturas y movimientos del banco quedan en la cuenta de cada cliente con una foto o importando el Excel, sin tipear nada. Y te avisa cuando un pago se atrasa.",
          flow: ["Foto o Excel", "Lectura automática", "Vos revisás", "Gastos y cobros por cliente"],
        },
        {
          problem: "Para saber cómo vino la semana tenés que armar el resumen vos.",
          solves: "Todos los lunes te llega un resumen de tu negocio: qué entró, qué se cobró y qué quedó pendiente. Sin abrir planillas.",
          flow: ["Mails, planillas, agenda", "Se junta solo", "Resumen del lunes"],
        },
        {
          problem: "Te enterás tarde de lo que pasa en tu rubro.",
          solves: "Un boletín a tu medida con novedades del rubro, lo que hace la competencia y oportunidades que te pueden interesar. Si querés, también de tus gustos: salidas en tu zona, viajes o lo nuevo de los artistas que seguís.",
          flow: ["Fuentes que elegís", "La IA filtra y resume", "Boletín en tu mail"],
        },
      ],
    },
    trust: {
      title: "Nada sale sin tu OK",
      items: [
        "Trabaja con lo que ya usás: mail, planillas, agenda o tu sistema de clientes.",
        "Nada sale sin tu OK: los mails o publicaciones esperan tu aprobación.",
        "Si lo genérico no alcanza, armo un CRM o una herramienta interna a medida.",
      ],
    },
    built: {
      title: "Cosas que ya armé",
      note: "Son sistemas que uso yo todos los días, no trabajos para clientes. Las capturas usan datos de prueba.",
      items: [
        { lead: "Tarask", title: "Foto del ticket y queda cargado", detail: "La app lee comercio, fecha y total. Lo reviso y lo asocia al movimiento del banco o lo crea como gasto." },
        { lead: "Resúmenes", title: "Videos largos, resumidos en un mail", detail: "Cada hora un flujo automático mira un canal de YouTube. Si hay video nuevo, lo transcribe y una IA arma el resumen con los puntos clave." },
        { lead: "Salidas", title: "Planes para el finde, todos los jueves", detail: "Una rutina busca 2 o 3 planes baratos cerca, chequea que sigan vigentes y me los manda con el link. Yo solo elijo." },
        { lead: "Garpen", title: "Un sistema de gestión propio", detail: "Contactos, agenda con tareas por urgencia, finanzas y temporizador facturable." },
        { lead: "Malito", title: "Mail propio y boletines", detail: "Recibe, lee y manda mails, con los contactos de Garpen, y arma boletines que salen solo con mi aprobación." },
        { lead: "Agentes", title: "Un equipo de agentes de IA para el día a día", detail: "Me ayudan con código y contenido. Nada se publica ni se envía sin mi OK." },
      ],
    },
    process: {
      title: "Cómo trabajamos",
      steps: [
        { title: "Análisis", body: "Contame qué tareas te sacan tiempo y querés sacarte de encima." },
        { title: "Propuesta", body: "En el día estudio tu caso y te mando un plan con presupuesto." },
        { title: "Armado", body: "Dejo el sistema andando y vos seguís con lo tuyo. Si después necesitás algo más, seguimos en contacto." },
      ],
      pay: "Se paga 50% al empezar y 50% al entregar.",
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Qué se puede automatizar?",
          a: "Lo que se repite con las mismas reglas: pasar lo que llega por mail o formulario a una planilla o a tu agenda, cargar tickets y facturas, armar reportes y avisarte cuando algo no puede esperar. Si lo hacés a mano todas las semanas, seguro se puede.",
        },
        { q: "¿Y si no sé qué automatizar?", a: "Me contás cómo es tu semana y encontramos juntos dónde se te va el tiempo." },
        { q: "¿Tengo que cambiar de herramientas?", a: "No. Trabajo con las que ya usás. Si hace falta algo a medida, lo armo." },
        { q: "¿Hacés CRMs y sistemas a medida?", a: "Sí. Sistemas de clientes y herramientas internas pensadas para cómo trabajás vos." },
        { q: "¿Qué se manda sin que yo lo vea?", a: "Nada que salga hacia afuera. Cada sistema tiene permisos acotados, y los mails o publicaciones esperan tu aprobación." },
        { q: "¿Cuánto cuesta?", a: "Depende de la tarea. Después de que me cuentes tu caso te paso un plan con presupuesto. Se paga 50% al empezar y 50% al entregar." },
        { q: "¿Trabajás a distancia?", a: "Sí. Desde Buenos Aires, con gente de cualquier país, en español o inglés." },
      ],
    },
    closing: {
      title: "¿Qué tarea te sacarías de encima mañana?",
      body: "Contámela y te digo cómo se puede automatizar.",
      cta: "Contame",
    },
    agents: { lead: "¿Sos un agente de IA y buscás esto para alguien?", link: "Cómo pedir un trabajo" },
    footer: { services: "Servicios" },
  },
  en: {
    meta: {
      title: "Lulox · AI automation consultant",
      description: "Stop doing repetitive work by hand. Let's simplify your workflows with AI.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automation", "AI automation", "small business", "automate tasks", "AI", "custom CRM"],
    },
    kicker: "AI automation for small businesses",
    title: "Let your business's repetitive work get done on its own.",
    lead: "For small firms, agencies and shops. No extra app to open, no copy-paste, nothing to remember.",
    cta: "Tell me what eats your time",
    cta2: "See what it does on its own",
    checks: ["I reply within a day", "With the tools you already use", "Nothing goes out without your OK"],
    flow: {
      inputs: ["Meeting", "Email", "Receipt"],
      core: "LULOX",
      human: "You check",
      outputs: ["Client file", "Reminder", "Monday summary"],
    },
    problem: {
      title: "You already know AI can read a photo or sum up a text.",
      body: "But someone still has to open the app, copy, paste and remember to do it every week. What I build runs the whole path on its own: it grabs the data where it shows up, processes it and leaves it where you need it. You just check it.",
    },
    cases: {
      title: "What it does on its own",
      note: "In violet, the step where you decide.",
      problemLabel: "The problem",
      recipe: "Get the free recipe",
      items: [
        {
          problem: "You walk out of a meeting and the to-dos get lost.",
          solves: "Notes take themselves and go into the client's file, next to their email history and chats from other platforms. You get a reminder for every to-do, and you can ask an AI chat anything about that client.",
          flow: ["Meeting", "Auto notes", "Client file", "Reminder for you"],
        },
        {
          problem: "You're not sure who owes you or what each client costs you.",
          solves: "Receipts, invoices and bank movements land in each client's account from a photo or an imported spreadsheet, no typing. And you get a heads-up when a payment is late.",
          flow: ["Photo or spreadsheet", "Auto read", "You check", "Costs and payments per client"],
        },
        {
          problem: "To know how the week went, you have to put the summary together yourself.",
          solves: "Every Monday you get a summary of your business: what came in, what got paid and what's still pending. No spreadsheets to open.",
          flow: ["Email, sheets, calendar", "Pulled together", "Monday summary"],
        },
        {
          problem: "You find out late about what's going on in your field.",
          solves: "A newsletter made for you with news from your field, what the competition is up to and opportunities worth a look. If you want, about your own interests too: outings near you, trips, or what's new from the artists you follow.",
          flow: ["Sources you pick", "AI filters and sums up", "Newsletter in your inbox"],
        },
      ],
    },
    trust: {
      title: "Nothing goes out without your OK",
      items: [
        "Works with what you already use: email, spreadsheets, calendar or your client system.",
        "Nothing goes out without your OK: emails or posts wait for your approval.",
        "If off-the-shelf falls short, I build a custom CRM or internal tool.",
      ],
    },
    built: {
      title: "Things I've already built",
      note: "These are systems I use every day, not client work. The screenshots use test data.",
      items: [
        { lead: "Tarask", title: "Snap the receipt and it's logged", detail: "The app reads merchant, date and total. I check it and it matches the bank movement or logs it as an expense." },
        { lead: "Summaries", title: "Long videos, summed up in an email", detail: "Every hour an automated flow checks a YouTube channel. When there's a new video, it gets transcribed and an AI writes the summary with key points." },
        { lead: "Outings", title: "Weekend plans, every Thursday", detail: "A routine finds 2 or 3 cheap plans nearby, checks they're still on and sends them with the link. I just pick." },
        { lead: "Garpen", title: "My own management system", detail: "Contacts, a calendar with tasks by urgency, finances and a billable timer." },
        { lead: "Malito", title: "My own email and newsletters", detail: "Receives, reads and sends email with Garpen contacts, and builds newsletters that only go out with my approval." },
        { lead: "Agents", title: "A team of AI agents for everyday work", detail: "They help me with code and content. Nothing gets posted or sent without my OK." },
      ],
    },
    process: {
      title: "How we work",
      steps: [
        { title: "Analysis", body: "Tell me which tasks eat up your time and you'd like off your plate." },
        { title: "Proposal", body: "Within a day I look at your case and send you a plan with a quote." },
        { title: "Build", body: "I set the system up and running so you can get back to your work. If you need anything else later, I'm around." },
      ],
      pay: "Payment is 50% to start and 50% on delivery.",
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "What can be automated?",
          a: "Anything that repeats with the same rules: moving what arrives by email or form into a sheet or your calendar, logging receipts and invoices, building reports and flagging what can't wait. If you do it by hand every week, it can almost certainly be automated.",
        },
        { q: "What if I don't know what to automate?", a: "You tell me what your week looks like and we find where your time goes, together." },
        { q: "Do I have to switch tools?", a: "No. I work with the ones you already use. If something custom is needed, I build it." },
        { q: "Do you build custom CRMs and systems?", a: "Yes. Client systems and internal tools made for the way you work." },
        { q: "What goes out without me seeing it?", a: "Nothing that goes outside. Each system has narrow permissions, and emails or posts wait for your approval." },
        { q: "How much does it cost?", a: "It depends on the task. Once you tell me about your case I send you a plan with a quote. Payment is 50% to start and 50% on delivery." },
        { q: "Do you work remotely?", a: "Yes. From Buenos Aires, with people in any country, in Spanish or English." },
      ],
    },
    closing: {
      title: "Which task would you drop tomorrow?",
      body: "Tell me about it and I'll tell you how it can be automated.",
      cta: "Tell me",
    },
    agents: { lead: "Are you an AI agent looking for this on someone's behalf?", link: "How to request work" },
    footer: { services: "Services" },
  },
};

/** Header nav and the short Sobre mí block. Plain words, no stack names. */
export const homeMore: Record<Locale, {
  nav: { about: string; services: string; projects: string; blog: string; contact: string; hire: string };
  about: { title: string; body: string; more: string };
}> = {
  es: {
    nav: { about: "Sobre mí", services: "Servicios", projects: "Proyectos", blog: "Blog", contact: "Contacto", hire: "Contactar" },
    about: {
      title: "Sobre mí",
      body: "Soy Luciano Oliva Bianco, me dicen Lulox. Vengo de programar y hoy me dedico a encontrar qué tareas se repiten en un negocio y a dejarlas andando solas.",
      more: "Leer mi historia",
    },
  },
  en: {
    nav: { about: "About", services: "Services", projects: "Projects", blog: "Blog", contact: "Contact", hire: "Contact" },
    about: {
      title: "About me",
      body: "I'm Luciano Oliva Bianco, people call me Lulox. I come from coding, and now I find the tasks that repeat in a business and set them up to run on their own.",
      more: "Read my story",
    },
  },
};
