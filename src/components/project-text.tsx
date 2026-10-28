"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { MdWysiwyg } from "@/components/md-wysiwyg";
import type { PortfolioProject } from "@/lib/projects";
import { useLocale } from "@/i18n/locale-provider";
import { COPY_CLASSES, prepCopyMarkdown } from "@/lib/md-editor-extensions";

/**
 * Edit mode: a project's summary or description edited in place. Saves only
 * the current locale through the admin-only /api/projects (rest unchanged).
 */
export function ProjectText({ project, field, className = "", pClass = "cp-prose" }: {
  project: PortfolioProject;
  field: "body" | "paragraphs";
  className?: string;
  pClass?: string;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const L = (locale === "en" ? "en" : "es") as "es" | "en";
  const copy = project.copy[L] ?? project.copy.es;
  const source = field === "body" ? copy.body : copy.paragraphs.join("\n\n");
  const classes = useMemo(() => ({ ...COPY_CLASSES, p: pClass }), [pClass]);
  return (
    <MdWysiwyg
      markdown={prepCopyMarkdown(source)}
      classes={classes}
      className={`md-copy ${className}`.trim()}
      onSave={async (md) => {
        const err = await saveProject(project.id, (p) => {
          if (field === "body") p.copy[L] = { ...p.copy[L], body: md.trim() };
          else p.copy[L] = { ...p.copy[L], paragraphs: md.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean) };
        });
        if (err) return err;
        router.refresh();
        return null;
      }}
    />
  );
}

/**
 * Read the current merged project from /api/projects, apply a change, and PUT
 * the whole record back (admin-only). Returns an error code or null.
 */
export async function saveProject(id: string, mutate: (p: PortfolioProject) => void): Promise<string | null> {
  const res = await fetch("/api/projects");
  if (!res.ok) return res.status === 401 ? "session" : String(res.status);
  const { projects } = (await res.json()) as { projects: PortfolioProject[] };
  const found = projects.find((x) => x.id === id);
  if (!found) return "not_found";
  const p: PortfolioProject = structuredClone(found);
  p.copy = {
    es: { ...p.copy.es, paragraphs: [...p.copy.es.paragraphs] },
    en: { ...p.copy.en, paragraphs: [...p.copy.en.paragraphs] },
  };
  p.disabledReason = { es: p.disabledReason?.es ?? "", en: p.disabledReason?.en ?? "" };
  p.team = [...(p.team ?? [])];
  mutate(p);
  const put = await fetch("/api/projects", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (put.ok) return null;
  const data = (await put.json().catch(() => ({}))) as { error?: string };
  return put.status === 401 ? "session" : (data.error ?? String(put.status));
}
