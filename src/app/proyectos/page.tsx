import { JsonLd } from "@/components/json-ld";
import { ProjectsView } from "@/components/views/projects-view";
import { canSeeDraftsRequest } from "@/lib/admin-request";
import { getProjects } from "@/lib/projects-db";
import { orderRecords } from "@/lib/site-sections";
import { getSiteOrder } from "@/lib/site-order";
import { getRequestLocale } from "@/lib/prefs";
import { projectsLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import "../home.css";
import "../showcase.css";

export const dynamic = "force-dynamic";

/** Projects come from D1. Hidden rows never reach a visitor; edit mode still gets them. */
export default async function ProjectsPage() {
  const [all, order, admin, locale, settings] = await Promise.all([getProjects(), getSiteOrder(), canSeeDraftsRequest(), getRequestLocale(), getSiteSettings()]);
  const projects = orderRecords(all, order.projects, admin);
  const visible = projects.filter((p) => p.visible);
  const pick = (p: (typeof visible)[number]) => ({ title: p.copy[locale]?.title || p.copy.es.title, body: p.copy[locale]?.body || p.copy.es.body });
  return (
    <>
      <JsonLd graph={[projectsLd(settings, locale, visible.map((p) => ({ id: p.id, icon: p.icon, ...pick(p) })))]} />
      <ProjectsView projects={projects} />
    </>
  );
}
