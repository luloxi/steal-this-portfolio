import { LLMS_FULL_AFTER_FAQ, LLMS_FULL_BEFORE_FAQ } from "@/content/llms-full";
import { homeCopy, withExtraFaq } from "@/content/home-copy";
import { recipesToText } from "@/content/recipes";
import { faqToText } from "@/lib/faq";
import { getFaq } from "@/lib/faq-db";

export const dynamic = "force-dynamic";

/** Long-form context for AI agents, with the landing FAQ as it is saved now. */
export async function GET() {
  const faq = withExtraFaq(await getFaq("en"), homeCopy.en.faq.extra);
  const body = `${LLMS_FULL_BEFORE_FAQ}${recipesToText()}\n## Frequently asked questions\n\n${faqToText(faq)}\n\n${LLMS_FULL_AFTER_FAQ}`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
