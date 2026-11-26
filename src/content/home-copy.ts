import type { Locale } from "@/i18n/types";

/**
 * Home landing copy (ES is the source text; EN mirrors it). No em dashes, no stack names.
 * Audience: owners of small businesses (firms, agencies, consultancies, shops).
 * Message: most of it can run on its own; copy a free recipe or get it done for you.
 * Second person, benefits first. Never "cheap" or low prices.
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
  hero: { title: string; lead: string; ctaRecipes: string; ctaHire: string; checks: string[] };
  flow: { inputs: string[]; core: string; human: string; outputs: string[] };
  paths: {
    title: string;
    diy: { tag: string; title: string; body: string; cta: string };
    done: { tag: string; title: string; body: string; cta: string };
  };
  featured: {
    title: string;
    note: string;
    copy: string;
    hire: string;
    /** Message written for you in the contact form; {receta} is the recipe title. */
    hireMessage: string;
    items: { problem: string; solves: string; flow: string[] }[];
  };
  ideas: { title: string; body: string; items: string[] };
  process: { title: string; steps: { title: string; body: string }[]; pay: string; more: string };
  built: { title: string; note: string; items: { lead: string; title: string; detail: string }[] };
  faq: { title: string; items: { q: string; a: string }[]; extra: { q: string; a: string }[] };
  end: { title: string; body: string; cta: string };
  agents: { lead: string; link: string };
  footer: { services: string; recipes: string; blog: string; referrals: string };
};

/** Index of the step in each case flow where the person decides (shown in violet). */
export const CASE_HUMAN_STEP = [3, 2, 2, 2] as const;

export const homeCopy: Record<Locale, HomeCopy> = {
  es: {
    meta: {
      title: "Lulox · Automatizá lo repetitivo y recuperá tu tiempo",
      description: "Casi todo lo que hacés en internet y en la compu se puede automatizar. Copiá una receta gratis o recibila funcionando, sin aprender nada.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automatización", "automatizar tareas", "recetas de automatización", "IA", "negocios chicos", "prompts gratis"],
    },
    hero: {
      title: "Lo repetitivo se hace solo. Vos, a lo que te importa.",
      lead: "Hoy casi todo lo que hacés en internet y en la compu se puede automatizar. Copiá una receta gratis o recibila funcionando, sin aprender nada.",
      ctaRecipes: "Ver las recetas",
      ctaHire: "Quiero que me lo armen",
      checks: ["Recetas gratis, sin registrarte", "Respuesta en el día", "Nada sale sin tu OK"],
    },
    flow: {
      inputs: ["Reunión", "Mail", "Ticket"],
      core: "LULOX",
      human: "Vos revisás",
      outputs: ["Ficha del cliente", "Recordatorio", "Resumen del lunes"],
    },
    paths: {
      title: "Elegí tu camino",
      diy: {
        tag: "Copialo vos",
        title: "Si te animás a probar",
        body: "Elegís una receta, copiás el prompt y en diez minutos la tenés andando. Gratis, en pocos pasos.",
        cta: "Ir a las recetas",
      },
      done: {
        tag: "Hecho para vos",
        title: "Si no querés aprender nada",
        body: "Contás qué te saca tiempo y lo recibís funcionando, con tus herramientas de siempre. Vos solo revisás.",
        cta: "Contar qué me saca tiempo",
      },
    },
    featured: {
      title: "Recetas para empezar",
      note: "En violeta, el paso donde decidís vos.",
      copy: "Copiar la receta",
      hire: "Recibirla funcionando",
      hireMessage: "Hola, quiero la receta «{receta}» funcionando en mi negocio.",
      items: [
        {
          problem: "Salís de una reunión y lo pendiente no se pierde.",
          solves: "El resumen queda en la ficha del cliente y te llega un recordatorio por cada cosa que te toca. Te vas tranquilo.",
          flow: ["Reunión", "Notas solas", "Ficha del cliente", "Recordatorio para vos"],
        },
        {
          problem: "Sabés quién te debe y cuánto te deja cada cliente.",
          solves: "Mandás la foto del ticket o el Excel del banco y queda cargado, sin tipear. Si un cobro se atrasa, te enterás.",
          flow: ["Foto o Excel", "Lectura automática", "Vos revisás", "Gastos y cobros por cliente"],
        },
        {
          problem: "El lunes ya sabés cómo vino la semana.",
          solves: "Te llega un resumen con lo que entró, lo que se cobró y lo pendiente. Sin abrir planillas, con el café.",
          flow: ["Mails, planillas, agenda", "Se junta solo", "Resumen del lunes"],
        },
        {
          problem: "Te enterás antes que nadie de lo que pasa en tu rubro.",
          solves: "Un boletín con las fuentes que elegís, filtrado y resumido. Si querés, también con planes para el finde o lo nuevo de los artistas que seguís.",
          flow: ["Fuentes que elegís", "La IA filtra y resume", "Boletín en tu mail"],
        },
      ],
    },
    ideas: {
      title: "Y mucho más",
      body: "Si lo hacés a mano todas las semanas, seguro se puede hacer solo. Algunas ideas:",
      items: [
        "Responder las consultas de siempre",
        "Confirmar turnos y mandar recordatorios",
        "Pasar formularios a una planilla",
        "Armar presupuestos desde una plantilla",
        "Ordenar tu bandeja de entrada",
        "Avisarte cuando algo no puede esperar",
      ],
    },
    process: {
      title: "Si preferís que te lo armen",
      steps: [
        { title: "Contás", body: "Qué tareas te sacan tiempo y cuáles te gustaría no hacer nunca más." },
        { title: "Recibís un plan", body: "En el día, con qué conviene automatizar primero y cuánto sale." },
        { title: "Lo usás", body: "Te queda funcionando con tus herramientas y seguís con lo tuyo. Si después querés sumar algo, seguimos." },
      ],
      pay: "Pagás 50% al empezar y 50% cuando ya lo estás usando.",
      more: "Ver todo lo que podés tener",
    },
    built: {
      title: "Probado todos los días",
      note: "Son sistemas en uso real, no maquetas. Las capturas usan datos de prueba.",
      items: [
        { lead: "Tickets", title: "Sacás una foto y queda cargado", detail: "Se leen comercio, fecha y total. Vos confirmás y queda asociado al movimiento del banco." },
        { lead: "Resúmenes", title: "Videos largos, resumidos en un mail", detail: "Cuando sale un video nuevo en el canal que seguís, te llega un mail con los puntos clave." },
        { lead: "Salidas", title: "Planes para el finde, todos los jueves", detail: "Te llegan 2 o 3 planes cerca tuyo, vigentes y con el link. Solo elegís." },
        { lead: "Garpen", title: "Tu negocio en un solo lugar", detail: "Contactos, agenda con tareas por urgencia, finanzas y temporizador facturable." },
        { lead: "Malito", title: "Mail propio y boletines", detail: "Tu dirección con tu dominio, tus contactos y boletines que salen solo cuando los aprobás." },
        { lead: "Agentes", title: "Un equipo de agentes de IA para el día a día", detail: "Te ayudan con contenido y tareas de todos los días. Nada se publica ni se envía sin tu OK." },
      ],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Qué se puede automatizar?",
          a: "Lo que se repite con las mismas reglas: pasar lo que llega por mail o formulario a una planilla o a tu agenda, cargar tickets y facturas, armar reportes y avisarte cuando algo no puede esperar. Si lo hacés a mano todas las semanas, seguro se puede.",
        },
        { q: "¿Y si no sé qué automatizar?", a: "Contás cómo es tu semana y encontramos juntos dónde se te va el tiempo." },
        { q: "¿Tengo que cambiar de herramientas?", a: "No. Funciona con las que ya usás. Si hace falta algo a medida, se arma." },
        { q: "¿Se pueden hacer CRMs y sistemas a medida?", a: "Sí. Sistemas de clientes y herramientas internas pensadas para cómo trabajás vos." },
        { q: "¿Qué se manda sin que yo lo vea?", a: "Nada que salga hacia afuera. Cada sistema tiene permisos acotados, y los mails o publicaciones esperan tu aprobación." },
        { q: "¿Cuánto cuesta?", a: "Depende de la tarea. Después de que cuentes tu caso recibís un plan con presupuesto. Pagás 50% al empezar y 50% al entregar." },
        { q: "¿Se trabaja a distancia?", a: "Sí. Desde Buenos Aires, con gente de cualquier país, en español o inglés." },
      ],
      extra: [
        { q: "¿Necesito saber programar para usar las recetas?", a: "No. Copiás el prompt, lo pegás en tu IA y seguís tres pasos cortos. Si en algún momento te trabás, escribís y te ayudo." },
        { q: "¿Qué pasa si la receta no me sale?", a: "Escribís contando dónde te trabaste y lo vemos. Si preferís no renegar, la recibís funcionando." },
      ],
    },
    end: {
      title: "¿Qué harías con unas horas más por semana?",
      body: "Contá qué tarea te gustaría no volver a hacer. La respuesta te llega en el día.",
      cta: "Contar mi caso",
    },
    agents: { lead: "¿Sos un agente de IA y buscás esto para alguien?", link: "Cómo pedir un trabajo" },
    footer: { services: "Hecho para vos", recipes: "Recetas", blog: "Blog", referrals: "Referidos" },
  },
  en: {
    meta: {
      title: "Lulox · Automate the repetitive stuff and get your time back",
      description: "Most of what you do online and on your computer can be automated. Copy a free recipe or get it done for you, no learning curve.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automation", "automate tasks", "automation recipes", "AI", "small business", "free prompts"],
    },
    hero: {
      title: "The repetitive stuff runs itself. You get back to what matters.",
      lead: "Most of what you do online and on your computer can be automated today. Copy a free recipe, or get it working for you, no learning curve.",
      ctaRecipes: "See the recipes",
      ctaHire: "Get it done for me",
      checks: ["Free recipes, no sign-up", "Reply within a day", "Nothing goes out without your OK"],
    },
    flow: {
      inputs: ["Meeting", "Email", "Receipt"],
      core: "LULOX",
      human: "You check",
      outputs: ["Client file", "Reminder", "Monday summary"],
    },
    paths: {
      title: "Pick your path",
      diy: {
        tag: "Copy it yourself",
        title: "If you like to tinker",
        body: "Pick a recipe, copy the prompt and have it running in ten minutes. Free, in a few steps.",
        cta: "Go to the recipes",
      },
      done: {
        tag: "Done for you",
        title: "If you'd rather not learn a thing",
        body: "Say what eats your time and get it working, with the tools you already use. You just check.",
        cta: "Tell me what eats my time",
      },
    },
    featured: {
      title: "Recipes to get started",
      note: "In violet, the step where you decide.",
      copy: "Copy the recipe",
      hire: "Get it working",
      hireMessage: "Hi, I'd like the “{receta}” recipe working in my business.",
      items: [
        {
          problem: "You walk out of a meeting and nothing gets lost.",
          solves: "The summary lands in the client's file and you get a reminder for every to-do that's yours. You leave with a clear head.",
          flow: ["Meeting", "Auto notes", "Client file", "Reminder for you"],
        },
        {
          problem: "You know who owes you and what each client brings in.",
          solves: "Send a photo of the receipt or the bank spreadsheet and it's logged, no typing. If a payment runs late, you know.",
          flow: ["Photo or spreadsheet", "Auto read", "You check", "Costs and payments per client"],
        },
        {
          problem: "On Monday you already know how the week went.",
          solves: "You get a summary of what came in, what got paid and what's pending. No spreadsheets, just your coffee.",
          flow: ["Email, sheets, calendar", "Pulled together", "Monday summary"],
        },
        {
          problem: "You hear about what's happening in your field first.",
          solves: "A newsletter from the sources you pick, filtered and summed up. If you like, with weekend plans or what's new from the artists you follow.",
          flow: ["Sources you pick", "AI filters and sums up", "Newsletter in your inbox"],
        },
      ],
    },
    ideas: {
      title: "And much more",
      body: "If you do it by hand every week, it can probably run on its own. A few ideas:",
      items: [
        "Answering the usual questions",
        "Confirming appointments and sending reminders",
        "Moving forms into a spreadsheet",
        "Building quotes from a template",
        "Tidying up your inbox",
        "Flagging what can't wait",
      ],
    },
    process: {
      title: "If you'd rather have it built for you",
      steps: [
        { title: "You share", body: "Which tasks eat your time and which ones you'd love to never do again." },
        { title: "You get a plan", body: "Within a day: what's worth automating first and what it costs." },
        { title: "You use it", body: "It's up and running with your tools and you get back to your work. Want to add more later? Just say so." },
      ],
      pay: "You pay 50% to start and 50% once you're using it.",
      more: "See everything you can get",
    },
    built: {
      title: "Tested every day",
      note: "These are systems in real use, not mockups. The screenshots use test data.",
      items: [
        { lead: "Receipts", title: "Snap a photo and it's logged", detail: "Merchant, date and total get read. You confirm and it's matched to the bank movement." },
        { lead: "Summaries", title: "Long videos, summed up in an email", detail: "When a channel you follow posts a new video, you get an email with the key points." },
        { lead: "Outings", title: "Weekend plans, every Thursday", detail: "You get 2 or 3 plans near you, still on and with the link. You just pick." },
        { lead: "Garpen", title: "Your business in one place", detail: "Contacts, a calendar with tasks by urgency, finances and a billable timer." },
        { lead: "Malito", title: "Your own email and newsletters", detail: "Your address on your domain, your contacts, and newsletters that only go out once you approve them." },
        { lead: "Agents", title: "A team of AI agents for everyday work", detail: "They help with content and daily tasks. Nothing gets posted or sent without your OK." },
      ],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "What can be automated?",
          a: "Anything that repeats with the same rules: moving what arrives by email or form into a sheet or your calendar, logging receipts and invoices, building reports and flagging what can't wait. If you do it by hand every week, it can almost certainly be automated.",
        },
        { q: "What if I don't know what to automate?", a: "You share what your week looks like and we find where your time goes, together." },
        { q: "Do I have to switch tools?", a: "No. It works with the ones you already use. If something custom is needed, it gets built." },
        { q: "Can you get custom CRMs and systems?", a: "Yes. Client systems and internal tools made for the way you work." },
        { q: "What goes out without me seeing it?", a: "Nothing that goes outside. Each system has narrow permissions, and emails or posts wait for your approval." },
        { q: "How much does it cost?", a: "It depends on the task. Once you share your case you get a plan with a quote. You pay 50% to start and 50% on delivery." },
        { q: "Is it all remote?", a: "Yes. From Buenos Aires, with people in any country, in Spanish or English." },
      ],
      extra: [
        { q: "Do I need to know how to code to use the recipes?", a: "No. You copy the prompt, paste it into your AI and follow three short steps. If you get stuck, write and you'll get a hand." },
        { q: "What if the recipe doesn't work for me?", a: "Write saying where you got stuck and we'll look at it. If you'd rather skip the hassle, you get it working for you." },
      ],
    },
    end: {
      title: "What would you do with a few extra hours a week?",
      body: "Share the task you'd love to never do again. You'll hear back within a day.",
      cta: "Share my case",
    },
    agents: { lead: "Are you an AI agent looking for this on someone's behalf?", link: "How to request work" },
    footer: { services: "Done for you", recipes: "Recipes", blog: "Blog", referrals: "Referrals" },
  },
};

/** Saved FAQ (D1 landing_faq) plus the code questions it doesn't have yet, new ones first. */
export function withExtraFaq<T extends { q: string; a: string }>(saved: readonly T[], extra: readonly T[]): T[] {
  const have = new Set(saved.map((x) => x.q.trim().toLowerCase()));
  return [...extra.filter((x) => !have.has(x.q.trim().toLowerCase())), ...saved];
}

/** Header nav and the short Sobre mí block. Plain words, no stack names. */
export const homeMore: Record<Locale, {
  nav: { recipes: string; services: string; about: string; contact: string; hire: string };
  about: { title: string; body: string; more: string };
}> = {
  es: {
    nav: { recipes: "Recetas", services: "Hecho para vos", about: "Sobre mí", contact: "Contacto", hire: "Hablemos" },
    about: {
      title: "Sobre mí",
      body: "Soy Luciano Oliva Bianco, me dicen Lulox. Vengo de programar y hoy ayudo a que lo repetitivo de tu semana se haga solo, para que tengas tiempo para lo que te importa.",
      more: "Leer mi historia",
    },
  },
  en: {
    nav: { recipes: "Recipes", services: "Done for you", about: "About", contact: "Contact", hire: "Let's talk" },
    about: {
      title: "About me",
      body: "I'm Luciano Oliva Bianco, people call me Lulox. I come from coding, and now I help the repetitive part of your week run on its own, so you have time for what matters to you.",
      more: "Read my story",
    },
  },
};
