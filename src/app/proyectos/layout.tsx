import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/proyectos", {
    es: { title: "Proyectos", description: "Lo que armé: Malito, Garpen, DJ Tube, SAMI, PunkSociety, Mochi y más." },
    en: { title: "Projects", description: "What I've built: Malito, Garpen, DJ Tube, SAMI, PunkSociety, Mochi and more." },
  });
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
