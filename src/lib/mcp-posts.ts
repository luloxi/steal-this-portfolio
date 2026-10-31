import { focusTopicIds } from "@/content/projects";
import type { BlogPost } from "@/content/blog/types";
import {
  getAllPosts,
  getPostBySlug,
  slugExists,
  takenSlugsEn,
  upsertPost,
} from "@/lib/blog";
import { getDb } from "@/lib/db";
import { isAllowedBlogImageUrl, isMediaKey } from "@/lib/media";
import type { McpResult } from "@/lib/mcp-route";
import { isValidSlug, slugify, uniqueSlug } from "@/lib/routes";
import { parseSlideUrl } from "@/lib/slide-embed";

type LocaleText = { es: string; en: string; copied: boolean };

function readLocale(value: unknown, esRequired: boolean): LocaleText | McpResult {
  if (value === undefined || value === null) {
    if (esRequired) return { status: 400, body: { error: "invalid_post" } };
    return { es: "", en: "", copied: false };
  }
  if (typeof value !== "object") return { status: 400, body: { error: "invalid_post" } };
  const rec = value as Record<string, unknown>;
  if (typeof rec.es !== "string" || (esRequired && !rec.es.trim())) {
    return { status: 400, body: { error: "invalid_post" } };
  }
  const es = rec.es;
  if (!("en" in rec) || typeof rec.en !== "string") return { es, en: es, copied: true };
  return { es, en: rec.en, copied: false };
}

function readStrings(value: unknown, error: string): string[] | McpResult {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return { status: 400, body: { error } };
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function isResult(value: unknown): value is McpResult {
  return Boolean(value) && typeof value === "object" && "status" in (value as object) && "body" in (value as object) && !("es" in (value as object));
}

function mdAlt(value: string): string {
  return value.replace(/[\[\]\r\n]/g, " ").replace(/\s+/g, " ").trim();
}

function mdLabel(value: string, fallback: string): string {
  const clean = value.replace(/[\[\]\\\r\n]/g, "").trim();
  return clean || fallback;
}

type ImageIn = { url: string; alt: string };
type SlideIn = { url: string; title: string };

function readImages(value: unknown): ImageIn[] | McpResult {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return { status: 400, body: { error: "invalid_image_url" } };
  const out: ImageIn[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return { status: 400, body: { error: "invalid_image_url" } };
    const rec = item as { url?: unknown; alt?: unknown; caption?: unknown };
    if (typeof rec.url !== "string" || !isAllowedBlogImageUrl(rec.url.trim())) {
      return { status: 400, body: { error: "invalid_image_url" } };
    }
    if (rec.alt !== undefined && typeof rec.alt !== "string") return { status: 400, body: { error: "invalid_image_url" } };
    if (rec.caption !== undefined && typeof rec.caption !== "string") return { status: 400, body: { error: "invalid_image_url" } };
    const alt = mdAlt(typeof rec.alt === "string" && rec.alt.trim() ? rec.alt : typeof rec.caption === "string" ? rec.caption : "");
    out.push({ url: rec.url.trim(), alt });
  }
  return out;
}

function readSlides(value: unknown): SlideIn[] | McpResult {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return { status: 400, body: { error: "invalid_slide" } };
  const out: SlideIn[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return { status: 400, body: { error: "invalid_slide" } };
    const rec = item as { url?: unknown; title?: unknown };
    if (typeof rec.url !== "string" || !parseSlideUrl(rec.url)) return { status: 400, body: { error: "invalid_slide" } };
    if (rec.title !== undefined && typeof rec.title !== "string") return { status: 400, body: { error: "invalid_slide" } };
    out.push({ url: rec.url.trim(), title: mdLabel(typeof rec.title === "string" ? rec.title : "", "Slides") });
  }
  return out;
}

function isAllowedCover(raw: string): boolean {
  const value = raw.trim();
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value.startsWith("/media/") && isMediaKey(value.slice("/media/".length));
  }
  return isAllowedBlogImageUrl(value);
}

function appendBlocks(body: string, blocks: string[]): string {
  const extra = blocks.filter(Boolean);
  const base = body.replace(/\s+$/, "");
  if (extra.length === 0) return base;
  return base ? `${base}\n\n${extra.join("\n\n")}` : extra.join("\n\n");
}

async function updatedBySlug(): Promise<Map<string, string>> {
  const db = await getDb();
  if (!db) return new Map();
  const { results } = await db.prepare("SELECT slug, updated_at FROM blog_posts").all<{ slug: string; updated_at: string }>();
  return new Map(results.map((row) => [row.slug, row.updated_at]));
}

function listItem(post: BlogPost, updated: string | null) {
  return {
    slug: post.slug,
    title: { es: post.title.es, en: post.title.en },
    published: post.published,
    publishedAt: post.publishedAt,
    updated,
  };
}

/** `drafts=1` lists every post (drafts included). Anything else is published only. */
export async function listMcpPosts(url: URL): Promise<McpResult> {
  const includeDrafts = url.searchParams.get("drafts") === "1";
  const [posts, updated] = await Promise.all([getAllPosts({ includeDrafts }), updatedBySlug()]);
  return {
    status: 200,
    body: { posts: posts.map((post) => listItem(post, updated.get(post.slug) ?? null)) },
  };
}

export async function getMcpPost(slug: string): Promise<McpResult> {
  const post = await getPostBySlug(slug, { includeDrafts: true });
  if (!post) return { status: 404, body: { error: "not_found" } };
  const updated = await updatedBySlug();
  return {
    status: 200,
    body: {
      post: {
        ...post,
        updated: updated.get(post.slug) ?? null,
      },
    },
  };
}

/**
 * Always inserts a draft (`published` on the body is ignored).
 * Never updates an existing slug.
 */
export async function createMcpDraft(payload: unknown): Promise<McpResult> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { status: 400, body: { error: "invalid_post" } };
  }
  const body = payload as Record<string, unknown>;
  const title = readLocale(body.title, true);
  if (isResult(title)) return title;
  const summary = readLocale(body.summary, false);
  if (isResult(summary)) return summary;
  const text = readLocale(body.body, false);
  if (isResult(text)) return text;
  const tags = readStrings(body.tags, "invalid_tags");
  if (isResult(tags)) return tags;
  const topicIn = readStrings(body.topics, "invalid_topics");
  if (isResult(topicIn)) return topicIn;
  const images = readImages(body.images);
  if (isResult(images)) return images;
  const slides = readSlides(body.slides);
  if (isResult(slides)) return slides;

  let cover = "";
  if (body.coverImage !== undefined) {
    if (typeof body.coverImage !== "string" || !isAllowedCover(body.coverImage)) {
      return { status: 400, body: { error: "invalid_cover" } };
    }
    cover = body.coverImage.trim();
  }
  if (!cover && images[0]) cover = images[0].url;

  const blocks = [
    ...images.map((img) => `![${img.alt}](${img.url})`),
    ...slides.map((slide) => `[${slide.title}](${slide.url})`),
  ];
  const bodyEs = appendBlocks(text.es, blocks);
  const bodyEn = appendBlocks(text.en, blocks);

  let slug: string;
  if (body.slug === undefined || body.slug === null || body.slug === "") {
    const base = slugify(title.es) || "post";
    slug = uniqueSlug(base, await takenSlugsEn([]));
  } else if (typeof body.slug !== "string" || !isValidSlug(body.slug)) {
    return { status: 400, body: { error: "invalid_slug" } };
  } else if (await slugExists(body.slug) || (await takenSlugsEn([body.slug])).includes(body.slug)) {
    // Primary key, or another post's slug_en (that would shadow /blog/<slug_en>).
    return { status: 409, body: { error: "slug_taken" } };
  } else {
    slug = body.slug;
  }

  const needsTranslation = title.copied || summary.copied || text.copied;
  const post: BlogPost = {
    slug,
    slugEn: null,
    published: false,
    publishedAt: new Date().toISOString().slice(0, 10),
    coverImage: cover,
    tags,
    topics: topicIn.filter((id) => (focusTopicIds as readonly string[]).includes(id)),
    title: { es: title.es, en: title.en },
    summary: { es: summary.es, en: summary.en },
    body: { es: bodyEs, en: bodyEn },
  };
  await upsertPost(post);
  return {
    status: 200,
    body: {
      ok: true,
      slug,
      slugEn: null,
      published: false,
      previewUrl: `/blog/${slug}`,
      needsTranslation,
    },
  };
}

/** Publish only when `confirm` is the boolean true. Idempotent if already published. */
export async function publishMcpPost(slug: string, payload: unknown): Promise<McpResult> {
  if (!payload || typeof payload !== "object" || (payload as { confirm?: unknown }).confirm !== true) {
    return { status: 400, body: { error: "confirm_required" } };
  }
  const post = await getPostBySlug(slug, { includeDrafts: true });
  if (!post) return { status: 404, body: { error: "not_found" } };

  let slugEn = post.slugEn?.trim() || null;
  if (!slugEn) {
    const base = slugify(post.title.en) || slug;
    slugEn = uniqueSlug(base || slug, await takenSlugsEn([slug]));
  }
  if (!(post.published && post.slugEn)) {
    await upsertPost({ ...post, published: true, slugEn });
  }
  return { status: 200, body: { ok: true, slug, slugEn, published: true } };
}
