import { permanentRedirect } from "next/navigation";

/** Retired: proxy.ts already 301s /contratar and /en/hire. This is the in-app backup. */
export default function RetiredHirePage() {
  permanentRedirect("/contacto");
}
