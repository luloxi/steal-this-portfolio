import { focusTopicIds } from "@/content/projects";
import { NextResponse } from "next/server";
import type { BlogPost } from "@/content/blog/types";
import {
  deletePost,
  getAllPosts,
  isSlugEnAvailable,
  requireAdminSession,
  slugExists,
  takenSlugsEn,
  upsertPost,
} from "@/lib/blog";
import { isReservedBlogSlug, isValidSlug, slugify, uniqueSlug } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 401 });
  }
  const posts = await getAllPosts({ includeDrafts: true });
  return NextResponse.json({ posts });
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

  const post = body as BlogPost & { previousSlug?: string };
  if (!post?.slug || !post.title?.es || !post.title?.en) {
    return NextResponse.json({ error: "invalid_post" }, { status: 400 });
  }

  const slug = post.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug || isReservedBlogSlug(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  // Renaming the Spanish slug: never overwrite another post.
  const previousSlug = typeof post.previousSlug === "string" && post.previousSlug !== slug ? post.previousSlug : undefined;
  if (previousSlug && (await slugExists(slug))) {
    return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  }

  // English slug: strict format (lowercase kebab-case, no accents), unique
  // across slug_en and Spanish slugs. Empty: published posts get one from
  // title_en (first free), drafts stay NULL (served at /en/blog/<slug>).
  let slugEn: string | null = null;
  const rawEn = typeof post.slugEn === "string" ? post.slugEn.trim() : "";
  if (rawEn) {
    if (!isValidSlug(rawEn) || isReservedBlogSlug(rawEn)) {
      return NextResponse.json({ error: "invalid_slug_en" }, { status: 400 });
    }
    if (!(await isSlugEnAvailable(rawEn, slug, previousSlug))) {
      return NextResponse.json({ error: "slug_en_taken" }, { status: 409 });
    }
    slugEn = rawEn;
  } else if (post.published) {
    const base = slugify(post.title.en) || slug;
    slugEn = uniqueSlug(base, await takenSlugsEn([slug, previousSlug ?? slug]));
  }

  const { previousSlug: _drop, ...clean } = post;
  void _drop;
  await upsertPost({
    ...clean,
    slug,
    slugEn,
    published: Boolean(post.published),
    tags: Array.isArray(post.tags) ? post.tags : [],
    topics: Array.isArray(post.topics)
      ? post.topics.map(String).filter((id: string) => focusTopicIds.includes(id))
      : [],
    coverImage: post.coverImage || "",
    publishedAt: post.publishedAt || new Date().toISOString().slice(0, 10),
    summary: {
      es: post.summary?.es ?? "",
      en: post.summary?.en ?? "",
    },
    body: {
      es: post.body?.es ?? "",
      en: post.body?.en ?? "",
    },
    title: {
      es: post.title.es,
      en: post.title.en,
    },
  }, previousSlug);

  return NextResponse.json({ ok: true, slug, slugEn });
}

export async function DELETE(request: Request) {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  }

  await deletePost(slug);
  return NextResponse.json({ ok: true });
}
