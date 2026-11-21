import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/contratar", {
    es: { title: "Contratar", description: "Presupuesto orientativo en segundos para automatizar con agentes de IA y n8n o armar un CRM a medida. 50% de anticipo y 50% al entregar." },
    en: { title: "Hire me", description: "A rough quote in seconds to automate with AI agents and n8n or build a custom CRM. 50% upfront and 50% on delivery." },
  });
}

export default function HireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
