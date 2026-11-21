import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/sobre-mi", {
    es: { title: "Sobre mí", description: "Quién soy: desarrollador que automatiza con agentes de IA y arma sistemas a medida. Mi historia y experiencia." },
    en: { title: "About", description: "Who I am: a developer who automates with AI agents and builds custom systems. My story and experience." },
  });
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
