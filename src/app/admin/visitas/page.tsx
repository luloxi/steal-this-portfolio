import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisitsAdmin } from "@/components/views/visits-admin";
import { getDb } from "@/lib/db";
import { loadVisitStats, utmLinks, type VisitStats } from "@/lib/page-visits";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visitas (admin)",
  robots: { index: false, follow: false },
};

const empty: VisitStats = { total: 0, hireTotal: 0, byDay: [], bySource: [], hireByDay: [], hireBySource: [] };

/**
 * Admin only. proxy.ts already answers 404 to anyone who isn't the allowlisted
 * admin; this re-checks on the server before reading anything.
 */
export default async function AdminVisitsPage() {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) notFound();
  let stats = empty;
  let error = false;
  try {
    const db = await getDb();
    stats = db ? await loadVisitStats(db) : empty;
  } catch (err) {
    console.error("[admin/visitas]", err);
    error = true;
  }
  return <VisitsAdmin stats={stats} links={utmLinks()} loadError={error} />;
}
