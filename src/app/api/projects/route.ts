import { NextResponse } from "next/server";
import type {
  PastProjectId,
  ProjectStatus,
  TeamMember,
} from "@/content/projects";
import {
  getMergedPastProjects,
  requireAdminSession,
  upsertProjectOverride,
} from "@/lib/projects";

export const dynamic = "force-dynamic";

const VALID_IDS: PastProjectId[] = ["djtube", "mochi", "sami", "punksociety"];
const VALID_STATUSES: ProjectStatus[] = ["live", "disabled", "archive"];

function parseTeam(raw: unknown): TeamMember[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = String((item as { name?: unknown }).name ?? "").trim();
      if (!name) return null;
      const href = String((item as { href?: unknown }).href ?? "").trim();
      return href ? { name, href } : { name };
    })
    .filter(Boolean) as TeamMember[];
}

function parseParagraphs(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((p) => String(p).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 401 });
  }
  const projects = await getMergedPastProjects();
  return NextResponse.json({ projects });
}

export async function PUT(request: Request) {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data = body as {
    id?: string;
    status?: string;
    disabledReason?: { es?: string; en?: string };
    liveUrl?: string;
    github?: string;
    team?: unknown;
    copy?: {
      es?: {
        title?: string;
        body?: string;
        paragraphs?: unknown;
        awards?: string;
      };
      en?: {
        title?: string;
        body?: string;
        paragraphs?: unknown;
        awards?: string;
      };
    };
  };

  if (!data?.id || !VALID_IDS.includes(data.id as PastProjectId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  if (!data.status || !VALID_STATUSES.includes(data.status as ProjectStatus)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  await upsertProjectOverride({
    id: data.id as PastProjectId,
    status: data.status as ProjectStatus,
    disabledReason: {
      es: data.disabledReason?.es ?? "",
      en: data.disabledReason?.en ?? "",
    },
    liveUrl: data.liveUrl ?? "",
    github: data.github ?? "",
    team: parseTeam(data.team),
    copy: {
      es: {
        title: data.copy?.es?.title ?? "",
        body: data.copy?.es?.body ?? "",
        paragraphs: parseParagraphs(data.copy?.es?.paragraphs),
        awards: data.copy?.es?.awards ?? "",
      },
      en: {
        title: data.copy?.en?.title ?? "",
        body: data.copy?.en?.body ?? "",
        paragraphs: parseParagraphs(data.copy?.en?.paragraphs),
        awards: data.copy?.en?.awards ?? "",
      },
    },
  });

  const projects = await getMergedPastProjects();
  return NextResponse.json({ ok: true, projects });
}
