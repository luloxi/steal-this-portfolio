import type { Metadata } from "next";
import { messages } from "@/i18n/messages";
import { projectBody, projectTitle } from "@/lib/projects";
import { getProject } from "@/lib/projects-db";
import { buildPageMetadata, pageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/prefs";
import { pathPair } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return pageMetadata("/proyectos", {
      es: { title: "Proyectos", description: messages.es.sections.projects },
      en: { title: "Projects", description: messages.en.sections.projects },
    });
  }
  const locale = await getRequestLocale();
  return buildPageMetadata(locale, pathPair(`/proyectos/${project.id}`), {
    title: projectTitle(project, locale),
    description: projectBody(project, locale),
  });
}

export default function ProjectDetailLayout({ children }: Props) {
  return children;
}
