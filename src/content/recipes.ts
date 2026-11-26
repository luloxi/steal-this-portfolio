import type { Locale } from "@/i18n/types";

/**
 * Free "recipes" (/recetas, /en/recipes): one per home case, in the same order.
 * Each one: the result first, what it needs (Grok, Grok Bot or Hermes only),
 * a self-guided prompt to copy (built by guided(): it asks, checks your connections,
 * walks you through what is missing, builds and tests), and short steps folded underneath.
 * Steps stay generic and true (no invented menus). No em dashes, no stack names.
 */
export type Recipe = {
  slug: string;
  copy: Record<Locale, {
    title: string;
    result: string;
    needs: string;
    steps: string[];
    prompt: string;
  }>;
};

type GuidedParts = {
  /** What you get, in one sentence (after "Ayudame a armar esto:"). */
  goal: string;
  /** Connections it needs, e.g. "mail, calendario y documentos (por ejemplo Gmail, Google Calendar y Google Drive)". */
  tools: string;
  /** Manual fallback when a connection is missing. */
  planB: string;
  /** What to ask, comma-separated. */
  ask: string;
  /** What to leave running. */
  build: string;
  /** How to test it together. */
  test: string;
};

/**
 * A prompt that drives itself: you paste it without reading it, and the AI
 * introduces itself, asks what it needs, checks which tool and connections you
 * have (connectors, integrations, MCP, scheduled tasks), walks you through what's
 * missing, builds it, tests it with you, and points to Luciano if you get stuck.
 */
function guided(locale: Locale, x: GuidedParts): string {
  if (locale === "es") {
    return [
      `Ayudame a armar esto: ${x.goal} No sé de tecnología, así que guiame vos.`,
      "Andá de a un paso y esperá mi respuesta antes de seguir:",
      "1. Presentate en una línea y preguntame qué estoy usando: Grok, Grok Bot o Hermes.",
      `2. Fijate qué conexiones tenés disponibles (conectores, integraciones, MCP o tareas programadas) para ${x.tools}. Decime cuáles ya están y cuáles faltan.`,
      `3. Si falta alguna, explicame paso a paso y con palabras simples cómo conectarla o activarla. Si no se puede, proponeme un plan B: ${x.planB}`,
      `4. Haceme pocas preguntas, de a una o de a dos, para saber ${x.ask}.`,
      `5. Dejalo armado así: ${x.build}`,
      `6. ${x.test}`,
      "Reglas: no inventes datos; si algo no lo encontrás, decímelo. No le mandes nada a nadie sin mi OK. Hablame simple y con calidez. Si nos trabamos, sugerime escribirle a Luciano en lulox.com.ar/contacto.",
    ].join("\n");
  }
  return [
    `Help me set this up: ${x.goal} I'm not a tech person, so please guide me.`,
    "Go one step at a time and wait for my answer before moving on:",
    "1. Introduce yourself in one line and ask me what I'm using: Grok, Grok Bot or Hermes.",
    `2. Check which connections you have available (connectors, integrations, MCP or scheduled tasks) for ${x.tools}. Tell me which ones are ready and which are missing.`,
    `3. If one is missing, walk me through connecting or turning it on, step by step, in plain words. If that's not possible, offer me a plan B: ${x.planB}`,
    `4. Ask me a few questions, one or two at a time, to find out ${x.ask}.`,
    `5. Set it up like this: ${x.build}`,
    `6. ${x.test}`,
    "Rules: don't make anything up; if you can't find something, tell me. Don't send anything to anyone without my OK. Keep it simple and warm. If we get stuck, suggest I write to Luciano at lulox.com.ar/en/contact.",
  ].join("\n");
}

export const RECIPES: Recipe[] = [
  {
    slug: "reunion-a-ficha",
    copy: {
      es: {
        title: "De la reunión a la ficha del cliente",
        result: "Terminás la reunión y ya tenés el resumen en la ficha del cliente y un recordatorio por cada pendiente tuyo.",
        needs: "Un bot de Grok Bot con tu Gmail, tu calendario y tu Drive.",
        steps: [
          "Abrí Grok Bot y creá un bot nuevo.",
          "Pegá el prompt y respondé lo que te pregunte: te ayuda a conectar tu mail, tu calendario y tu Drive.",
          "Después de cada reunión, mandale tus notas o la transcripción.",
        ],
        prompt: guided("es", {
          goal: "después de cada reunión, el resumen queda en la ficha del cliente y me llega un recordatorio por cada pendiente mío.",
          tools: "mail, calendario y documentos (por ejemplo Gmail, Google Calendar y Google Drive)",
          planB: "que yo te pegue las notas y vos me devuelvas el resumen y los pendientes listos para copiar.",
          ask: "dónde guardo las fichas de mis clientes, cómo te voy a pasar las notas o la transcripción, y si querés entrar vos a mis llamadas",
          build: "cada vez que te pase las notas de una reunión, escribí un resumen corto de lo que se decidió, guardalo en la ficha del cliente (un documento por cliente; si no existe, crealo), listá los pendientes con responsable y fecha, y poneme un recordatorio en el calendario por cada uno que sea mío. Si no sabés de qué cliente es, preguntame.",
          test: "Hagamos una prueba con una reunión inventada y mostrame cómo quedó la ficha y el recordatorio.",
        }),
      },
      en: {
        title: "From the meeting to the client file",
        result: "The meeting ends and the summary is already in the client's file, with a reminder for each of your to-dos.",
        needs: "A Grok Bot bot with your Gmail, calendar and Drive.",
        steps: [
          "Open Grok Bot and create a new bot.",
          "Paste the prompt and answer its questions: it helps you connect your email, calendar and Drive.",
          "After each meeting, send it your notes or the transcript.",
        ],
        prompt: guided("en", {
          goal: "after every meeting, the summary lands in the client's file and I get a reminder for each to-do that's mine.",
          tools: "email, calendar and documents (for example Gmail, Google Calendar and Google Drive)",
          planB: "I paste you the notes and you give me back the summary and the to-dos ready to copy.",
          ask: "where I keep my client files, how I'll send you the notes or transcript, and whether you should join my calls yourself",
          build: "every time I give you the notes of a meeting, write a short summary of what was decided, save it in the client's file (one document per client; create it if it doesn't exist), list the to-dos with owner and date, and add a calendar reminder for each one that's mine. If you're not sure which client it is, ask me.",
          test: "Let's test it with a made-up meeting and show me how the file and the reminder turned out.",
        }),
      },
    },
  },
  {
    slug: "gastos-y-cobros",
    copy: {
      es: {
        title: "Gastos y cobros por cliente, sin tipear",
        result: "Mandás la foto de un ticket o el Excel del banco y queda cargado en una planilla por cliente. Y te avisa si un cobro se atrasa.",
        needs: "Un bot de Grok Bot con Google Sheets. Para el aviso de atrasos, una rutina semanal en el mismo bot.",
        steps: [
          "Abrí Grok Bot y creá un bot nuevo.",
          "Pegá el prompt y respondé lo que te pregunte: te ayuda a conectar tus planillas y a programar el aviso.",
          "Desde ahí, mandale fotos de tickets y facturas, o el Excel del banco.",
        ],
        prompt: guided("es", {
          goal: "mando la foto de un ticket o factura, o el Excel del banco, y queda cargado en una planilla por cliente. Y me avisás si un cobro se atrasa.",
          tools: "planillas (por ejemplo Google Sheets) y, para el aviso, una tarea programada",
          planB: "que me devuelvas cada movimiento como una fila lista para pegar en mi planilla.",
          ask: "si ya tengo una planilla o la creamos (por ejemplo «Cuentas por cliente», con fecha, cliente, concepto, gasto o cobro, monto y estado), cuáles son mis clientes principales, y qué día y a qué hora quiero el aviso de atrasos",
          build: "cada vez que te mande una foto o un Excel, leé los datos, mostrame lo que entendiste y, cuando te diga que está bien, cargalo. Si no sabés de qué cliente es, preguntame. Una vez por semana, avisame qué cobros siguen pendientes hace más de 30 días.",
          test: "Probemos con un ticket inventado y mostrame la fila cargada y cómo te va a llegar el aviso.",
        }),
      },
      en: {
        title: "Costs and payments per client, no typing",
        result: "Send a photo of a receipt or your bank spreadsheet and it lands in a sheet per client. And you get a heads-up when a payment is late.",
        needs: "A Grok Bot bot with Google Sheets. For the late-payment heads-up, a weekly routine in the same bot.",
        steps: [
          "Open Grok Bot and create a new bot.",
          "Paste the prompt and answer its questions: it helps you connect your sheets and schedule the heads-up.",
          "From then on, send it photos of receipts and invoices, or your bank spreadsheet.",
        ],
        prompt: guided("en", {
          goal: "I send a photo of a receipt or invoice, or my bank spreadsheet, and it lands in a sheet per client. And you tell me when a payment is late.",
          tools: "spreadsheets (for example Google Sheets) and, for the heads-up, a scheduled task",
          planB: "you give me each movement back as a row ready to paste into my sheet.",
          ask: "whether I already have a sheet or we create one (for example \"Accounts by client\", with date, client, item, cost or payment, amount and status), who my main clients are, and what day and time I want the late-payment heads-up",
          build: "every time I send a photo or a spreadsheet, read it, show me what you understood and, once I say it's right, add it. If you're not sure which client it is, ask me. Once a week, tell me which payments have been pending for more than 30 days.",
          test: "Let's test it with a made-up receipt and show me the row and how the heads-up will reach me.",
        }),
      },
    },
  },
  {
    slug: "resumen-del-lunes",
    copy: {
      es: {
        title: "El resumen del lunes, solo",
        result: "Todos los lunes te llega cómo vino la semana: qué entró, qué se cobró, qué quedó pendiente y qué tenés por delante.",
        needs: "Una tarea programada: una automatización semanal en Grok, una rutina en Grok Bot o un cron en Hermes.",
        steps: [
          "Abrí Grok, Grok Bot o Hermes.",
          "Pegá el prompt y respondé lo que te pregunte: te ayuda a conectar tu mail, tu calendario y tu planilla, y a programarlo para los lunes.",
          "Revisá la primera prueba y listo, te llega solo.",
        ],
        prompt: guided("es", {
          goal: "todos los lunes me llega un resumen corto de cómo vino la semana: qué entró, qué se cobró, qué quedó pendiente y qué tengo por delante.",
          tools: "mail, calendario y planillas (por ejemplo Gmail, Google Calendar y Google Sheets), y una tarea programada semanal",
          planB: "que cada lunes yo te pida «armá el resumen» y te pegue lo que no puedas leer solo.",
          ask: "en qué planilla llevo mis números, qué cuenta como «entró» en mi negocio (consultas, pedidos, ventas), a qué hora quiero el resumen y cómo me gusta recibirlo (mail o aviso)",
          build: "una tarea programada todos los lunes que junte, en menos de 15 líneas: qué entró por mail, qué se cobró y qué quedó pendiente según mi planilla, qué tengo esta semana en el calendario y las 3 cosas que no pueden esperar.",
          test: "Corramos el resumen una vez ahora, a mano, para ver si está bien antes de dejarlo andando.",
        }),
      },
      en: {
        title: "The Monday summary, on its own",
        result: "Every Monday you get how the week went: what came in, what got paid, what's still pending and what's coming up.",
        needs: "A scheduled task: a weekly automation in Grok, a routine in Grok Bot or a cron job in Hermes.",
        steps: [
          "Open Grok, Grok Bot or Hermes.",
          "Paste the prompt and answer its questions: it helps you connect your email, calendar and sheet, and schedule it for Mondays.",
          "Check the first test run and you're done, it arrives on its own.",
        ],
        prompt: guided("en", {
          goal: "every Monday I get a short summary of how the week went: what came in, what got paid, what's still pending and what's coming up.",
          tools: "email, calendar and spreadsheets (for example Gmail, Google Calendar and Google Sheets), plus a weekly scheduled task",
          planB: "every Monday I ask you to \"write the summary\" and paste in whatever you can't read on your own.",
          ask: "which sheet holds my numbers, what counts as \"came in\" for my business (inquiries, orders, sales), what time I want the summary and how I like to get it (email or notification)",
          build: "a scheduled task every Monday that pulls together, in under 15 lines: what came in by email, what got paid and what's pending according to my sheet, what's on my calendar this week and the 3 things that can't wait.",
          test: "Let's run the summary once now, by hand, to check it before leaving it running.",
        }),
      },
    },
  },
  {
    slug: "boletin-a-medida",
    copy: {
      es: {
        title: "Tu boletín a medida",
        result: "Una vez por semana te llega un boletín corto con lo que pasa en tu rubro, lo que hace la competencia y oportunidades que te pueden servir.",
        needs: "Una tarea programada. Lo más simple es una automatización semanal en Grok, que ya busca en la web y en X. También sirve una rutina en Grok Bot o un cron en Hermes.",
        steps: [
          "Abrí Grok, Grok Bot o Hermes. En Grok, una automatización semanal ya busca en la web y en X.",
          "Pegá el prompt y respondé lo que te pregunte: te ayuda a elegir las fuentes y a programar el envío.",
          "Mirá el primer boletín, pedile ajustes y listo.",
        ],
        prompt: guided("es", {
          goal: "una vez por semana me llega un boletín corto con lo que pasa en mi rubro, lo que hace la competencia y oportunidades que me pueden servir.",
          tools: "búsqueda en la web y en X, mail para recibirlo y una tarea programada semanal",
          planB: "que cada semana yo te pida «armá el boletín» y te pase los links que vi.",
          ask: "de qué es mi negocio y en qué ciudad o país, qué fuentes sigo (sitios, cuentas de X o newsletters; si no sé, sugerime algunas), quiénes son mi competencia, y qué día y a qué hora lo quiero",
          build: "una tarea programada semanal que mire esas fuentes y me mande: las 5 novedades más importantes, una línea cada una con el link; qué anda haciendo la competencia; y oportunidades como eventos, convocatorias o clientes posibles. Nada de relleno; si no hay novedades, decilo en una línea.",
          test: "Armemos un primer boletín ahora, a mano, y ajustamos lo que no me sirva.",
        }),
      },
      en: {
        title: "Your own newsletter",
        result: "Once a week you get a short newsletter with what's happening in your field, what the competition is up to and opportunities worth a look.",
        needs: "A scheduled task. The simplest is a weekly automation in Grok, which already searches the web and X. A routine in Grok Bot or a cron job in Hermes works too.",
        steps: [
          "Open Grok, Grok Bot or Hermes. In Grok, a weekly automation already searches the web and X.",
          "Paste the prompt and answer its questions: it helps you pick the sources and schedule it.",
          "Read the first newsletter, ask for tweaks and you're set.",
        ],
        prompt: guided("en", {
          goal: "once a week I get a short newsletter with what's happening in my field, what the competition is up to and opportunities worth a look.",
          tools: "web and X search, email to receive it and a weekly scheduled task",
          planB: "every week I ask you to \"put the newsletter together\" and give you the links I saw.",
          ask: "what my business is about and in which city or country, which sources I follow (sites, X accounts or newsletters; if I don't know, suggest some), who my competitors are, and what day and time I want it",
          build: "a weekly scheduled task that checks those sources and sends me: the 5 most important news items, one line each with the link; what the competition is up to; and opportunities like events, open calls or potential clients. No filler; if there's nothing new, say so in one line.",
          test: "Let's put together a first newsletter now, by hand, and adjust whatever isn't useful.",
        }),
      },
    },
  },
];

export const recipesCopy: Record<Locale, {
  meta: { title: string; description: string };
  title: string;
  intro: string;
  works: string;
  needsLabel: string;
  promptLabel: string;
  copy: string;
  copied: string;
  stepsLabel: string;
  use: string;
  hide: string;
  /** Per recipe: get it working instead. {receta} is the recipe title. */
  hire: { button: string; message: string };
  cta: { title: string; body: string; button: string };
}> = {
  es: {
    meta: {
      title: "Recetas gratis para automatizar tu negocio con IA",
      description: "Cuatro recetas listas: de la reunión a la ficha del cliente, gastos y cobros sin tipear, el resumen del lunes y tu boletín a medida. Copiá el prompt y listo.",
    },
    title: "Recetas gratis",
    intro: "Elegí una receta, tocá «Usar la receta», copiá el prompt y pegalo en tu IA. Respondé lo que te pregunte: te guía paso a paso. Si preferís no tocar nada, recibila funcionando.",
    works: "Funcionan con Grok, Grok Bot o Hermes.",
    needsLabel: "Qué necesitás",
    promptLabel: "El prompt",
    copy: "Copiar",
    copied: "¡Copiado!",
    stepsLabel: "Cómo armarlo, en 3 pasos",
    use: "Usar la receta",
    hide: "Ocultar la receta",
    hire: {
      button: "Recibirla funcionando",
      message: "Hola, quiero la receta «{receta}» funcionando en mi negocio.",
    },
    cta: {
      title: "¿No sabés configurarlo, necesitás ayuda o querés otra cosa?",
      body: "Contá qué te gustaría que se haga solo y lo recibís funcionando.",
      button: "Pedir una mano",
    },
  },
  en: {
    meta: {
      title: "Free recipes to automate your business with AI",
      description: "Four ready-made recipes: from the meeting to the client file, costs and payments with no typing, the Monday summary and your own newsletter. Copy the prompt and you're set.",
    },
    title: "Free recipes",
    intro: "Pick a recipe, tap \"Use the recipe\", copy the prompt and paste it into your AI. Answer its questions: it walks you through every step. If you'd rather not touch a thing, get it working for you.",
    works: "They work with Grok, Grok Bot or Hermes.",
    needsLabel: "What you need",
    promptLabel: "The prompt",
    copy: "Copy",
    copied: "Copied!",
    stepsLabel: "How to set it up, in 3 steps",
    use: "Use the recipe",
    hide: "Hide the recipe",
    hire: {
      button: "Get it working",
      message: "Hi, I'd like the “{receta}” recipe working in my business.",
    },
    cta: {
      title: "Not sure how to set it up, need a hand or want something else?",
      body: "Share what you'd like to run on its own and get it working.",
      button: "Get a hand",
    },
  },
};

/** Plain-text block for /llms-full.txt (English, with the Spanish URL). */
export function recipesToText(): string {
  const head = "## Free recipes\n\nSpanish: https://lulox.com.ar/recetas · English: https://lulox.com.ar/en/recipes\n\nOne free do-it-yourself recipe per home example. Each one works with Grok, Grok Bot or Hermes.\n";
  const items = RECIPES.map((r) => {
    const x = r.copy.en;
    return `### ${x.title}\n\nResult: ${x.result}\nWhat you need: ${x.needs}\nSteps: ${x.steps.map((s, i) => `${i + 1}) ${s}`).join(" ")}\nPrompt to copy:\n${x.prompt}\n`;
  });
  return [head, ...items].join("\n");
}
