import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/proyectos", {
    es: { title: "Proyectos", description: "Lo que construí: Garpen (CRM y ERP personal), Tarask (finanzas), Malito (correo propio) y más, con agentes de IA, automatización y apps web." },
    en: { title: "Projects", description: "What I've built: Garpen (personal CRM and ERP), Tarask (finances), Malito (own email inbox) and more, with AI agents, automation and web apps." },
  });
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
