import type { Locale } from "@/i18n/types";

/**
 * Home landing copy (ES is the source text; EN mirrors it). No em dashes.
 * Audience: freelancers and independent professionals. Message: I understand the
 * problem, decide what's worth doing and automate it (AI comes last, never first).
 */
/**
 * D1 projects offered on the sales pages (home Proyectos with a demo, /servicios).
 * Personal projects (Tarask, DJ Tube, Mochi...) live only on /proyectos and /sobre-mi.
 */
export const HOME_PROJECT_IDS = ["garpen", "malito"] as const;

export const homeCopy: Record<Locale, {
  meta: { title: string; description: string; keywords: string[] };
  title: string;
  lead: string;
  faq: { title: string; items: { q: string; a: string }[] };
  closing: string;
  agents: { lead: string; link: string };
  footer: { services: string };
}> = {
  es: {
    meta: {
      title: "Lulox · Menos tareas, más trabajo de verdad",
      description:
        "Para independientes y freelancers: encuentro dónde se traba tu trabajo, decido qué conviene y automatizo lo que se repite con IA.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automatización", "freelancers", "independientes", "automatizar tareas", "IA", "CRM a medida"],
    },
    title: "Menos tareas, más trabajo de verdad.",
    lead: "Entiendo qué te come el tiempo y lo saco de encima.",
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Y si no sé qué automatizar?",
          a: "Para eso está el diagnóstico. Me contás cómo es tu semana y encontramos juntos dónde se te va el tiempo.",
        },
        {
          q: "¿Qué se puede automatizar?",
          a: "Lo que se repite con las mismas reglas: ordenar el correo y contestar lo de siempre, pasar lo que llega por mail o formulario a una planilla o una agenda, cargar facturas y tickets desde una foto, armar reportes y avisarte cuando algo no puede esperar. Si lo hacés a mano todas las semanas, seguro se puede.",
        },
        {
          q: "¿Cuánto cuesta?",
          a: "Depende de la tarea. Después del diagnóstico te paso un presupuesto. Se paga 50% al empezar y 50% al entregar.",
        },
        {
          q: "¿Con qué herramientas trabajás?",
          a: "Con las que ya usás: mail, planillas, tu agenda o tu sistema de clientes. No tenés que cambiar nada.",
        },
        {
          q: "¿Hacés CRMs y sistemas a medida?",
          a: "Sí. Sistemas de clientes y herramientas pensadas para cómo trabajás.",
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
      title: "Lulox · Fewer chores, more real work",
      description:
        "For freelancers and independent professionals: I find where your work gets stuck, decide what's worth doing and automate what repeats with AI.",
      keywords: ["Lulox", "Luciano Oliva Bianco", "automation", "freelancers", "independent professionals", "automate tasks", "AI", "custom CRM"],
    },
    title: "Fewer chores, more real work.",
    lead: "I figure out what eats your time and take it off your plate.",
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "What if I don't know what to automate?",
          a: "That's what the diagnosis is for. You tell me what your week looks like and we find where your time goes, together.",
        },
        {
          q: "What can be automated?",
          a: "Anything that repeats with the same rules: sorting email and answering the usual questions, moving what arrives by email or form into a sheet or a calendar, logging invoices and receipts from a photo, building reports and flagging what can't wait. If you do it by hand every week, it can almost certainly be automated.",
        },
        {
          q: "How much does it cost?",
          a: "It depends on the task. After the diagnosis I send you a quote. Payment is 50% to start and 50% on delivery.",
        },
        {
          q: "What tools do you work with?",
          a: "The ones you already use: email, spreadsheets, your calendar or your client system. You don't have to switch anything.",
        },
        {
          q: "Do you build custom CRMs and systems?",
          a: "Yes. Client systems and tools made for the way you work.",
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

/** Home sections: header nav, services (the offer in 3 steps + light examples), about. Plain words, no stack names. */
export const homeMore: Record<Locale, {
  nav: { about: string; services: string; projects: string; blog: string; contact: string; hire: string };
  about: { title: string; body: string; more: string };
  services: { title: string; lead: string; steps: { title: string; body: string }[]; casesTitle: string; cta: string; more: string };
}> = {
  es: {
    nav: { about: "Sobre mí", services: "Servicios", projects: "Proyectos", blog: "Blog", contact: "Contacto", hire: "Contactar" },
    about: {
      title: "Sobre mí",
      body: "Soy Luciano Oliva Bianco, me dicen Lulox. Antes programaba; hoy me dedico a entender problemas, encontrar dónde se traba el trabajo, decidir qué conviene y automatizarlo.",
      more: "Leer mi historia",
    },
    services: {
      title: "Servicios",
      lead: "Tres pasos, de la primera charla a algo que ya funciona.",
      steps: [
        { title: "Diagnóstico", body: "Una charla para encontrar dónde se traba tu trabajo." },
        { title: "Decisión", body: "Qué conviene resolver y cómo. Te paso un presupuesto." },
        { title: "Armado", body: "Lo dejo andando con tus herramientas y lo probás con tu trabajo real." },
      ],
      casesTitle: "Por ejemplo",
      cta: "Empezar por el diagnóstico",
      more: "Ver los servicios en detalle",
    },
  },
  en: {
    nav: { about: "About", services: "Services", projects: "Projects", blog: "Blog", contact: "Contact", hire: "Contact" },
    about: {
      title: "About me",
      body: "I'm Luciano Oliva Bianco, people call me Lulox. I used to code; now I work on understanding problems, finding where work gets stuck, deciding what's worth doing and automating it.",
      more: "Read my story",
    },
    services: {
      title: "Services",
      lead: "Three steps, from the first chat to something that already works.",
      steps: [
        { title: "Diagnosis", body: "A chat to find where your work gets stuck." },
        { title: "Decision", body: "What's worth solving and how. I send you a quote." },
        { title: "Build", body: "I set it up with your tools and you try it on your real work." },
      ],
      casesTitle: "For example",
      cta: "Start with the diagnosis",
      more: "See the services in detail",
    },
  },
};
