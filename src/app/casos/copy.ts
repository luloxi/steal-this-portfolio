import type { Locale } from "@/i18n/types";

/** Shared UI strings for /casos and /casos/[slug]. No em dashes. */
export const casosUi: Record<Locale, {
  home: string; title: string; metaTitle: string; metaDescription: string; lead: string; kicker: string;
  whatIs: (name: string) => string; problem: string; solution: string; forWhom: string; status: string; stack: string;
  open: string; code: string; project: string; demoNote: string; cta: string; ctaBtn: string; others: string; caseLink: string;
}> = {
  es: {
    home: "Inicio",
    title: "Casos",
    metaTitle: "Casos: agentes de IA, CRMs y automatizaciones reales | Lulox",
    metaDescription: "Proyectos reales de Lulox con demo en video: Genki, Malito, Tarask, Garpen y la flota de bots con Grok Bot. Problema, solución y stack de cada uno.",
    lead: "Proyectos reales que uso todos los días, cada uno con una demo corta grabada con datos de prueba. Sin clientes ni números inventados.",
    kicker: "Caso",
    whatIs: (n) => `¿Qué es ${n}?`,
    problem: "¿Qué problema resuelve?",
    solution: "¿Cómo lo resuelve?",
    forWhom: "Para quién",
    status: "Estado",
    stack: "Stack",
    open: "Abrir la app",
    code: "Código en GitHub",
    project: "Ficha del proyecto",
    demoNote: "Demo grabada con datos de prueba, sin datos reales.",
    cta: "¿Querés algo así para tu equipo o tu negocio?",
    ctaBtn: "Contratar",
    others: "Otros casos",
    caseLink: "Ver el caso",
  },
  en: {
    home: "Home",
    title: "Case studies",
    metaTitle: "Case studies: real AI agents, CRMs and automations | Lulox",
    metaDescription: "Real Lulox projects with a video demo: Genki, Malito, Tarask, Garpen and the Grok Bot fleet. Problem, solution and stack for each one.",
    lead: "Real projects I use every day, each with a short demo recorded with test data. No invented clients or numbers.",
    kicker: "Case study",
    whatIs: (n) => `What is ${n}?`,
    problem: "What problem does it solve?",
    solution: "How does it solve it?",
    forWhom: "For whom",
    status: "Status",
    stack: "Stack",
    open: "Open the app",
    code: "Code on GitHub",
    project: "Project page",
    demoNote: "Demo recorded with test data, no real data.",
    cta: "Want something like this for your team or business?",
    ctaBtn: "Hire me",
    others: "Other case studies",
    caseLink: "Read the case",
  },
};
