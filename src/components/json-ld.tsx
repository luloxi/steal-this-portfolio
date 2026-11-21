import { ldScript } from "@/lib/seo";

/** Server-rendered JSON-LD block (see src/lib/seo.ts). */
export function JsonLd({ graph }: { graph: Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(graph) }} />;
}
