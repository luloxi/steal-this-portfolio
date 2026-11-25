import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/blog";
import { validateFaqItems } from "@/lib/faq";
import { saveFaq } from "@/lib/faq-db";

export const dynamic = "force-dynamic";

/** Admin only: replace the landing FAQ list of one language ({ locale, items: [{ q, a }] }). */
export async function PUT(request: Request) {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 401 });
  let body: { locale?: unknown; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const locale = body.locale === "es" || body.locale === "en" ? body.locale : null;
  if (!locale) return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  const v = validateFaqItems(body.items);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  await saveFaq(locale, v.items);
  return NextResponse.json({ ok: true, locale, items: v.items });
}
