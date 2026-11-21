import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/contacto", {
    es: { title: "Contacto", description: "Escribime para automatizar el trabajo repetitivo de tu equipo con agentes de IA y n8n, o encontrame en redes." },
    en: { title: "Contact", description: "Write to me to automate your team's repetitive work with AI agents and n8n, or find me on social media." },
  });
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
