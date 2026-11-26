import type { Locale } from "@/i18n/types";

/**
 * Free "recipes" (/recetas, /en/recipes): one per home case, in the same order.
 * Each one: the result first, what it needs (Grok, Grok Bot or Hermes only),
 * a prompt to copy, and the setup steps folded underneath.
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

export const RECIPES: Recipe[] = [
  {
    slug: "reunion-a-ficha",
    copy: {
      es: {
        title: "De la reunión a la ficha del cliente",
        result: "Terminás la reunión y ya tenés el resumen en la ficha del cliente y un recordatorio por cada pendiente tuyo.",
        needs: "Un bot de Grok Bot con tu Gmail, tu calendario y tu Drive.",
        steps: [
          "Creá un bot en Grok Bot y conectá tu Gmail, tu calendario y tu Google Drive.",
          "Pegale el prompt de arriba una sola vez.",
          "Después de cada reunión, mandale tus notas o la transcripción. Si querés, pedile que entre él a la llamada.",
        ],
        prompt: "Cada vez que te pase las notas o la transcripción de una reunión:\n1. Escribí un resumen corto con lo que se decidió.\n2. Guardalo en la ficha del cliente: un documento por cliente en mi Drive (si no existe, crealo).\n3. Listá los pendientes con responsable y fecha, y poneme un recordatorio en el calendario para cada uno que sea mío.\nSi no sabés de qué cliente es, preguntame. No le mandes nada a nadie sin mi OK.",
      },
      en: {
        title: "From the meeting to the client file",
        result: "The meeting ends and the summary is already in the client's file, with a reminder for each of your to-dos.",
        needs: "A Grok Bot bot with your Gmail, calendar and Drive.",
        steps: [
          "Create a bot in Grok Bot and connect your Gmail, your calendar and your Google Drive.",
          "Paste the prompt above once.",
          "After each meeting, send it your notes or the transcript. If you like, ask it to join the call itself.",
        ],
        prompt: "Every time I give you the notes or transcript of a meeting:\n1. Write a short summary of what was decided.\n2. Save it in the client's file: one document per client in my Drive (create it if it doesn't exist).\n3. List the to-dos with owner and date, and add a calendar reminder for each one that's mine.\nIf you're not sure which client it is, ask me. Don't send anything to anyone without my OK.",
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
          "Creá un bot en Grok Bot y conectá Google Sheets.",
          "Pegale el prompt de arriba una sola vez.",
          "Desde ahí, mandale fotos de tickets y facturas, o el Excel del banco, cuando quieras.",
        ],
        prompt: "Llevame los gastos y cobros por cliente en una planilla de Google llamada «Cuentas por cliente» (creala si no existe), con columnas: fecha, cliente, concepto, gasto o cobro, monto y estado (pagado o pendiente).\nCada vez que te mande una foto de un ticket o factura, o un Excel del banco, leé los datos y mostrame lo que entendiste. Cuando te diga que está bien, cargalo.\nSi no sabés de qué cliente es, preguntame.\nTodos los lunes a la mañana, avisame qué cobros siguen pendientes hace más de 30 días.",
      },
      en: {
        title: "Costs and payments per client, no typing",
        result: "Send a photo of a receipt or your bank spreadsheet and it lands in a sheet per client. And you get a heads-up when a payment is late.",
        needs: "A Grok Bot bot with Google Sheets. For the late-payment heads-up, a weekly routine in the same bot.",
        steps: [
          "Create a bot in Grok Bot and connect Google Sheets.",
          "Paste the prompt above once.",
          "From then on, send it photos of receipts and invoices, or your bank spreadsheet, whenever you want.",
        ],
        prompt: "Keep my costs and payments per client in a Google Sheet called \"Accounts by client\" (create it if it doesn't exist), with columns: date, client, item, cost or payment, amount and status (paid or pending).\nEvery time I send you a photo of a receipt or invoice, or a bank spreadsheet, read it and show me what you understood. When I say it's right, add it.\nIf you're not sure which client it is, ask me.\nEvery Monday morning, tell me which payments have been pending for more than 30 days.",
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
          "Conectá tu Gmail, tu calendario y la planilla donde llevás tus números.",
          "Creá una tarea semanal para los lunes a las 8, o pedíselo en el chat: «todos los lunes a las 8 hacé esto».",
          "Pegá el prompt de arriba y probalo una vez a mano antes de dejarlo andando.",
        ],
        prompt: "Todos los lunes a las 8, armame un resumen de mi negocio de la semana pasada, en menos de 15 líneas:\n1. Qué entró: consultas y pedidos nuevos que llegaron por mail.\n2. Qué se cobró y qué quedó pendiente, según mi planilla [nombre de la planilla].\n3. Qué tengo esta semana en el calendario.\n4. Las 3 cosas que no pueden esperar.\nSi algo no lo encontrás, decímelo en vez de inventarlo.",
      },
      en: {
        title: "The Monday summary, on its own",
        result: "Every Monday you get how the week went: what came in, what got paid, what's still pending and what's coming up.",
        needs: "A scheduled task: a weekly automation in Grok, a routine in Grok Bot or a cron job in Hermes.",
        steps: [
          "Connect your Gmail, your calendar and the sheet where you keep your numbers.",
          "Create a weekly task for Mondays at 8, or just ask in the chat: \"every Monday at 8, do this\".",
          "Paste the prompt above and run it once by hand before you leave it running.",
        ],
        prompt: "Every Monday at 8, write me a summary of my business for last week, in under 15 lines:\n1. What came in: new inquiries and orders that arrived by email.\n2. What got paid and what's still pending, according to my sheet [sheet name].\n3. What I have on my calendar this week.\n4. The 3 things that can't wait.\nIf you can't find something, tell me instead of making it up.",
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
          "Anotá de 3 a 10 fuentes de tu rubro: sitios, cuentas de X o newsletters.",
          "Creá una tarea semanal y elegí que te llegue por mail.",
          "Pegá el prompt de arriba con tus fuentes y probalo una vez a mano.",
        ],
        prompt: "Cada viernes a las 9, armame un boletín corto sobre [tu rubro] en [tu ciudad o país].\nMirá estas fuentes: [tus fuentes].\nIncluí:\n1. Las 5 novedades más importantes, una línea cada una, con el link.\n2. Qué anda haciendo la competencia: [nombres].\n3. Oportunidades que me pueden servir: eventos, convocatorias o clientes posibles.\nNada de relleno. Si no hay novedades, decilo en una línea.",
      },
      en: {
        title: "Your own newsletter",
        result: "Once a week you get a short newsletter with what's happening in your field, what the competition is up to and opportunities worth a look.",
        needs: "A scheduled task. The simplest is a weekly automation in Grok, which already searches the web and X. A routine in Grok Bot or a cron job in Hermes works too.",
        steps: [
          "Write down 3 to 10 sources from your field: sites, X accounts or newsletters.",
          "Create a weekly task and choose to get it by email.",
          "Paste the prompt above with your sources and run it once by hand.",
        ],
        prompt: "Every Friday at 9, put together a short newsletter about [your field] in [your city or country].\nCheck these sources: [your sources].\nInclude:\n1. The 5 most important news items, one line each, with the link.\n2. What the competition is up to: [names].\n3. Opportunities worth a look: events, open calls or potential clients.\nNo filler. If there's nothing new, say so in one line.",
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
  /** Per recipe: get it working instead. {receta} is the recipe title. */
  hire: { lead: string; button: string; message: string };
  cta: { title: string; body: string; button: string };
}> = {
  es: {
    meta: {
      title: "Recetas gratis para automatizar tu negocio con IA",
      description: "Cuatro recetas listas: de la reunión a la ficha del cliente, gastos y cobros sin tipear, el resumen del lunes y tu boletín a medida. Copiá el prompt y listo.",
    },
    title: "Recetas gratis",
    intro: "Lo que viste en la home, para que lo armes vos. Elegí una, copiá el prompt y pegalo en tu IA.",
    works: "Funcionan con Grok, Grok Bot o Hermes.",
    needsLabel: "Qué necesitás",
    promptLabel: "El prompt",
    copy: "Copiar",
    copied: "¡Copiado!",
    stepsLabel: "Cómo armarlo, en 3 pasos",
    hire: {
      lead: "¿Sin tiempo para configurarla?",
      button: "Recibila funcionando",
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
    intro: "What you saw on the home page, for you to set up yourself. Pick one, copy the prompt and paste it into your AI.",
    works: "They work with Grok, Grok Bot or Hermes.",
    needsLabel: "What you need",
    promptLabel: "The prompt",
    copy: "Copy",
    copied: "Copied!",
    stepsLabel: "How to set it up, in 3 steps",
    hire: {
      lead: "No time to set it up?",
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
