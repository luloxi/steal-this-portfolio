import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { bodyFromForm, handleHireContact, type HireDeps, type HireEnv } from "@/lib/hire-contact";
import { getDb } from "@/lib/db";
import { getActiveReferrer, insertLead } from "@/lib/referrals-db";
import { loadPricing } from "@/lib/pricing-db";
import { getSiteSettings } from "@/lib/site-settings-db";

export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  const isForm = type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data");
  let body: unknown;
  try {
    body = isForm ? bodyFromForm((await request.formData()).entries()) : await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { env, ctx } = await getCloudflareContext({ async: true });
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const db = await getDb();
  // Same stored amounts the page shows (code defaults if no rows); never the browser's numbers.
  const [pricing, settings] = await Promise.all([loadPricing(db), getSiteSettings()]);
  const deps: HireDeps = db
    ? { pricing, fromName: settings.name, publicUrl: settings.url, findReferrer: (code) => getActiveReferrer(db, code), saveLead: (lead) => insertLead(db, lead) }
    : { pricing, fromName: settings.name, publicUrl: settings.url };
  // After the email is sent, a copy goes to Serpix (Service Binding SERPIX + shared secret). Failures are ignored: the visitor and the email are unaffected.
  deps.forward = (inquiry) => {
    const e = env as unknown as { SERPIX?: { fetch: typeof fetch }; SERPIX_INBOUND_SECRET?: string };
    if (!e.SERPIX || !e.SERPIX_INBOUND_SECRET) return;
    ctx.waitUntil(
      e.SERPIX.fetch("https://erp.lulox.com.ar/api/inbound/portfolio", { method: "POST", headers: { "content-type": "application/json", "x-serpix-secret": e.SERPIX_INBOUND_SECRET }, body: JSON.stringify(inquiry) }).then(
        (r) => { if (!r.ok) console.error("[hire-contact] serpix forward status", r.status); },
        () => console.error("[hire-contact] serpix forward failed"),
      ),
    );
  };
  const r = await handleHireContact(body, env as unknown as HireEnv, ip, deps);
  if (isForm) {
    // Plain form post: send the browser back to the page with the result in the URL.
    const to = new URL("/contratar", request.url);
    to.searchParams.set("contacto", r.body.ok ? "ok" : String(r.body.error ?? "error"));
    to.hash = "hire-form-panel";
    return NextResponse.redirect(to, 303);
  }
  return NextResponse.json(r.body, { status: r.status, headers: { "Cache-Control": "no-store" } });
}
