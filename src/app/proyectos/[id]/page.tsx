import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/views/project-detail";
import { getProject } from "@/lib/projects-db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function PastProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
