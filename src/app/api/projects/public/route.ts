import { NextResponse } from "next/server";
import { getProjects } from "@/lib/projects-db";
import { getSiteOrder } from "@/lib/site-order";
import { hiddenSet, orderRecords } from "@/lib/site-sections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const order = await getSiteOrder();
    const projects = hiddenSet(order.sections).has("projects")
      ? []
      : orderRecords(await getProjects(), order.projects).filter((p) => p.visible);
    return NextResponse.json(
      { projects },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (err) {
    console.error("[api/projects/public]", err);
    return NextResponse.json({ projects: [], error: "failed" }, { status: 500 });
  }
}
