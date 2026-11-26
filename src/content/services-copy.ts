import type { Locale } from "@/i18n/types";

/**
 * /servicios (/en/services): «Hecho para vos», the done-for-you path.
 * The five old service pages live here as sections (ids = their old slugs; 301s in next.config.ts).
 * Second person, benefits first, no stack names, never "cheap". No em dashes.
 */
export const SERVICE_SECTION_IDS = ["agentes-de-ia", "automatizacion-de-procesos", "crm-a-medida", "grok-bot", "automatizar-whatsapp-y-mail"] as const;

export type ServicesCopy = {
  meta: { title: string; description: string };
  title: string;
  intro: string;
  cta: string;
  offer: { title: string; items: { title: string; body: string }[] };
  useCases: { title: string; note: string; items: { title: string; body: string }[] };
  custom: { title: string; body: string; projectsLabel: string };
  process: { title: string; steps: string[] };
  recipes: { body: string; link: string };
  closing: { title: string; cta: string };
  offers: { name: string; description: string }[];
};

export const servicesCopy: Record<Locale, ServicesCopy> = {
  es: {
    meta: {
      title: "Automatización hecha para vos: recuperá horas cada semana",
      description: "Contás qué te saca tiempo y lo recibís funcionando con tus herramientas: asistentes con IA, tareas que se hacen solas, CRM a medida, WhatsApp y mail en orden.",
    },
    title: "Hecho para vos",
    intro: "No hace falta que aprendas nada. Contás qué te saca tiempo y lo recibís funcionando, con las herramientas que ya usás. Vos revisás y seguís con lo tuyo.",
    cta: "Contar qué me saca tiempo",
    offer: {
      title: "Lo que podés tener",
      items: [
        { title: "Un asistente con IA que trabaja por vos", body: "Lee mails y documentos, carga los datos donde van y te avisa cuando algo necesita tu decisión. Nada sale sin tu OK." },
        { title: "Tareas repetidas que se hacen solas", body: "Lo que hoy pasás de un mail a una planilla, de un formulario a tu agenda o de un sistema a otro, corre solo y sin errores de tipeo." },
        { title: "Tu CRM, a tu manera", body: "Contactos, seguimiento, agenda y presupuestos en un solo lugar, con solo lo que tu negocio usa." },
        { title: "Asistentes en tus apps de siempre", body: "Tienen al día a cada cliente, cargan lo que hoy pasás a mano y te arman boletines a tu medida, del trabajo y de tu vida." },
        { title: "WhatsApp y mail en orden", body: "Lo que se repite se responde solo, lo urgente te llega primero y en WhatsApp tenés borradores listos para que decidas si se mandan." },
      ],
    },
    useCases: {
      title: "Qué podés sacarte de encima",
      note: "Son ejemplos de lo que se puede hacer.",
      items: [
        { title: "Correo y consultas", body: "Tus mails llegan ordenados, las respuestas de siempre ya están escritas y te enterás al toque de lo urgente." },
        { title: "Ventas y seguimiento", body: "Cada consulta queda registrada con su seguimiento agendado. Nadie queda sin respuesta." },
        { title: "Facturas y tickets", body: "Sacás una foto o mandás el PDF y fecha, monto y proveedor quedan cargados." },
        { title: "Reportes y resúmenes", body: "Te llega un resumen diario o semanal con los números que te importan, sin abrir planillas." },
        { title: "Agenda y recordatorios", body: "Los turnos se confirman solos y lo que llega por otros canales aparece en tu agenda." },
        { title: "Documentos", body: "Presupuestos, contratos o informes listos a partir de tu plantilla y los datos que ya tenés." },
      ],
    },
    custom: {
      title: "Cuando lo genérico no alcanza",
      body: "Si las herramientas de siempre te obligan a trabajar como ellas quieren, podés tener un sistema hecho para tu forma de trabajar. Algunos en uso real:",
      projectsLabel: "Proyectos",
    },
    process: {
      title: "Cómo es",
      steps: [
        "Contás qué tareas te sacan tiempo.",
        "En el día recibís un plan con qué conviene hacer primero y el presupuesto.",
        "Lo usás con tus herramientas. Pagás 50% al empezar y 50% cuando ya lo estás usando.",
      ],
    },
    recipes: { body: "¿Te animás a probar por tu cuenta?", link: "Mirá las recetas gratis" },
    closing: { title: "¿Qué harías con unas horas más por semana?", cta: "Contar mi caso" },
    offers: [
      { name: "Diagnóstico y plan", description: "Una charla para encontrar dónde se te va el tiempo y un plan con presupuesto." },
      { name: "Asistentes con IA", description: "Asistentes que leen, ordenan, resumen y redactan dentro de tu trabajo, con tu aprobación antes de enviar." },
      { name: "Automatización de tareas", description: "Mail, planillas, formularios, CRMs y agendas conectados para que lo repetitivo corra solo." },
      { name: "CRM a medida", description: "Contactos, seguimiento, agenda y presupuestos, con solo lo que tu negocio usa." },
      { name: "WhatsApp y mail", description: "Respuestas a lo que se repite, avisos de lo urgente y borradores listos para aprobar." },
    ],
  },
  en: {
    meta: {
      title: "Automation done for you: get hours back every week",
      description: "Share what eats your time and get it working with your tools: AI assistants, tasks that run themselves, a custom CRM, WhatsApp and email under control.",
    },
    title: "Done for you",
    intro: "No need to learn a thing. Share what eats your time and get it working, with the tools you already use. You check it and get on with your day.",
    cta: "Tell me what eats my time",
    offer: {
      title: "What you can get",
      items: [
        { title: "An AI assistant that works for you", body: "It reads emails and documents, puts the data where it belongs and flags anything that needs your call. Nothing goes out without your OK." },
        { title: "Repetitive tasks that run themselves", body: "What you move today from an email to a sheet, from a form to your calendar or from one system to another runs on its own, with no typos." },
        { title: "Your CRM, your way", body: "Contacts, follow-ups, calendar and quotes in one place, with only what your business uses." },
        { title: "Assistants in the apps you already use", body: "They keep every client up to date, log what you type by hand today and put together newsletters made for you, about work and your life." },
        { title: "WhatsApp and email under control", body: "The repetitive questions get answered, the urgent ones reach you first, and on WhatsApp you get drafts ready for you to send or not." },
      ],
    },
    useCases: {
      title: "What you can take off your plate",
      note: "These are examples of what can be done.",
      items: [
        { title: "Email and inquiries", body: "Your inbox arrives sorted, the usual replies are already written and you hear about urgent things right away." },
        { title: "Sales and follow-up", body: "Every inquiry is logged with its follow-up scheduled. Nobody goes unanswered." },
        { title: "Invoices and receipts", body: "Snap a photo or send the PDF and date, amount and vendor get logged." },
        { title: "Reports and summaries", body: "A daily or weekly summary with the numbers you care about, no spreadsheets to open." },
        { title: "Scheduling and reminders", body: "Appointments confirm themselves and what arrives on other channels shows up in your calendar." },
        { title: "Documents", body: "Quotes, contracts or reports ready from your template and the data you already have." },
      ],
    },
    custom: {
      title: "When off-the-shelf falls short",
      body: "If the usual tools force you to work their way, you can have a system made for the way you work. A few in real use:",
      projectsLabel: "Projects",
    },
    process: {
      title: "How it goes",
      steps: [
        "You share which tasks eat your time.",
        "Within a day you get a plan with what to do first and a quote.",
        "You use it with your tools. You pay 50% to start and 50% once you're using it.",
      ],
    },
    recipes: { body: "Feel like trying it yourself?", link: "See the free recipes" },
    closing: { title: "What would you do with a few extra hours a week?", cta: "Share my case" },
    offers: [
      { name: "Diagnosis and plan", description: "A chat to find where your time goes and a plan with a quote." },
      { name: "AI assistants", description: "Assistants that read, sort, summarize and write inside your work, with your approval before anything goes out." },
      { name: "Task automation", description: "Email, sheets, forms, CRMs and calendars connected so the repetitive work runs on its own." },
      { name: "Custom CRM", description: "Contacts, follow-ups, calendar and quotes, with only what your business uses." },
      { name: "WhatsApp and email", description: "Answers to the repetitive questions, alerts for what's urgent and drafts ready to approve." },
    ],
  },
};
