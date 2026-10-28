import { ProjectsView } from "@/components/views/projects-view";
import { canSeeDraftsRequest } from "@/lib/admin-request";
import { getProjects } from "@/lib/projects-db";
import { orderRecords } from "@/lib/site-sections";
import { getSiteOrder } from "@/lib/site-order";

export const dynamic = "force-dynamic";

/** Projects come from D1. Hidden rows never reach a visitor; edit mode still gets them. */
export default async function ProjectsPage() {
  const [all, order, admin] = await Promise.all([getProjects(), getSiteOrder(), canSeeDraftsRequest()]);
  return <ProjectsView projects={orderRecords(all, order.projects, admin)} />;
}
