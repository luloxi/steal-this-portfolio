import { pageMetadata } from "@/lib/page-metadata";
import "../home.css";

export function generateMetadata() {
  return pageMetadata("/contacto", {
    es: { title: "Contacto", description: "Mandame un mensaje o agendá una videollamada. También me encontrás en redes." },
    en: { title: "Contact", description: "Send me a message or book a video call. You can also find me on social media." },
  });
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
