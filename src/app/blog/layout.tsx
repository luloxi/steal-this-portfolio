import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/blog", {
    es: { title: "Blog", description: "Artículos sobre agentes de IA, automatización, lo que voy construyendo y lo que aprendí en el camino." },
    en: { title: "Blog", description: "Articles on AI agents, automation, what I'm building and what I learned along the way." },
  });
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
