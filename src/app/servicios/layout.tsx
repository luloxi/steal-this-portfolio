import { servicesCopy } from "@/content/services-copy";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/servicios", {
    es: { title: servicesCopy.es.meta.title, description: servicesCopy.es.meta.description },
    en: { title: servicesCopy.en.meta.title, description: servicesCopy.en.meta.description },
  });
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
