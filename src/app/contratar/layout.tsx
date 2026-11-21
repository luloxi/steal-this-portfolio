import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/contratar", {
    es: { title: "Contratar", description: "Contame qué hace tu equipo a mano: armo agentes de IA y automatizaciones con Grok, Grok Bot y Hermes, y CRMs a medida. Te respondo por email." },
    en: { title: "Hire me", description: "Tell me what your team does by hand: I build AI agents and automations with Grok, Grok Bot and Hermes, and custom CRMs. I reply by email." },
  });
}

export default function HireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
