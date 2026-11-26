/**
 * The old /servicios/<slug> pages (and /en/services/<slug>) now live as sections
 * of /servicios. 301s keep links and search results working; the hash lands on the card.
 */
const PAIRS: readonly (readonly [es: string, en: string])[] = [
  ["agentes-de-ia", "ai-agents"],
  ["automatizacion-de-procesos", "process-automation"],
  ["crm-a-medida", "custom-crm"],
  ["grok-bot", "grok-bot"],
  ["automatizar-whatsapp-y-mail", "whatsapp-and-email-automation"],
];

export const SERVICE_REDIRECTS: readonly (readonly [from: string, to: string])[] = PAIRS.flatMap(([es, en]) => [
  [`/servicios/${es}`, `/servicios#${es}`],
  [`/en/services/${en}`, `/en/services#${es}`],
]);
