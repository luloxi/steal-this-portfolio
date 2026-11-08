import { headers } from "next/headers";
import { SignInPanel } from "@/components/views/sign-in-panel";
import { nextFromReferer, safeNext } from "@/lib/referrals";

type Props = { searchParams: Promise<{ error?: string | string[]; next?: string | string[] }> };

export default async function SignInPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  const h = await headers();
  const fromQuery = safeNext(typeof next === "string" ? next : undefined, "");
  const fromReferer = nextFromReferer(h.get("referer"), h.get("x-forwarded-host") ?? h.get("host"), "");
  // ?next= wins; else the page you came from (Referer). Last resort: /blog.
  return <SignInPanel error={typeof error === "string" ? error : null} next={fromQuery || fromReferer || "/blog"} />;
}
