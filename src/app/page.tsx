import { headers } from "next/headers";
import { HomeGate } from "@/components/desktop/home-gate";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ win?: string | string[] }>;
}) {
  const [h, sp] = await Promise.all([headers(), searchParams]);
  const flag = Array.isArray(sp.win) ? sp.win[0] : sp.win;
  const embed = h.get("x-lulox-embed") === "1" || flag === "portfolio";
  return <HomeGate embed={embed} />;
}
