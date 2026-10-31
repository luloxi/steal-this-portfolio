import { cache } from "react";
import { seedPosts } from "@/content/blog/seed";
import {
  rowToPost,
  type BlogPost,
  type BlogPostRow,
} from "@/content/blog/types";
import { getDb, nowIso, requireDb } from "@/lib/db";
import { slugify } from "@/lib/routes";

let ensurePromise: Promise<void> | null = null;

/**
 * Schema lives in migrations/0001_init.sql (applied with wrangler d1 migrations).
 * This only seeds the default posts if the table is empty (fresh local DB).
 */
export async function ensureBlogSchemaAndSeed() {
  const db = await getDb();
  if (!db) return;
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const row = await db
        .prepare("SELECT COUNT(*) AS n FROM blog_posts")
        .first<{ n: number }>();
      if (Number(row?.n ?? 0) > 0) return;
      await db.batch(
        seedPosts.map((post) =>
          db
            .prepare(
              `INSERT INTO blog_posts (
                slug, slug_en, published_at, cover_image, tags,
                title_es, title_en, summary_es, summary_en,
                body_es, body_en, published, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT (slug) DO NOTHING`,
            )
            .bind(
              post.slug,
              post.slugEn || slugify(post.title.en) || null,
              toIsoDate(post.publishedAt),
              post.coverImage,
              JSON.stringify(post.tags ?? []),
              post.title.es,
              post.title.en,
              post.summary.es,
              post.summary.en,
              post.body.es,
              post.body.en,
              post.published !== false ? 1 : 0,
              nowIso(),
            ),
        ),
      );
    })().catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  await ensurePromise;
}

/** Normalize YYYY-MM-DD or any ISO string to full ISO UTC (matches Neon export). */
function toIsoDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? nowIso() : d.toISOString();
}

type D1BlogRow = Omit<BlogPostRow, "tags" | "topics" | "published"> & {
  tags: string | null;
  topics?: string | null;
  published: number;
};

function d1RowToPost(row: D1BlogRow): BlogPost {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags ?? "[]") as unknown;
    if (Array.isArray(parsed)) tags = parsed.map(String);
  } catch {
    tags = [];
  }
  let topics: string[] = [];
  try {
    const parsed = JSON.parse(row.topics ?? "[]") as unknown;
    if (Array.isArray(parsed)) topics = parsed.map(String);
  } catch {
    topics = [];
  }
  return rowToPost({ ...row, tags, topics, published: row.published === 1 });
}

function sortByDateDesc(posts: BlogPost[]) {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function seedPostsFiltered(includeDrafts?: boolean) {
  const posts = includeDrafts
    ? seedPosts
    : seedPosts.filter((p) => p.published !== false);
  return sortByDateDesc(posts.map((p) => ({ ...p, slugEn: seedSlugEn(p) })));
}

const seedSlugEn = (p: BlogPost) => p.slugEn || slugify(p.title.en) || null;

function seedPostBySlug(slug: string, includeDrafts?: boolean, by: "slug" | "slug_en" = "slug") {
  const post =
    seedPosts.find((p) => (by === "slug" ? p.slug === slug : seedSlugEn(p) === slug)) ?? null;
  if (!post) return null;
  if (!includeDrafts && post.published === false) return null;
  return { ...post, slugEn: seedSlugEn(post) };
}

export async function getAllPosts(opts?: {
  includeDrafts?: boolean;
}): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) {
    return seedPostsFiltered(opts?.includeDrafts);
  }

  try {
    await ensureBlogSchemaAndSeed();
    const { results } = await db
      .prepare(
        opts?.includeDrafts
          ? "SELECT * FROM blog_posts ORDER BY published_at DESC"
          : "SELECT * FROM blog_posts WHERE published = 1 ORDER BY published_at DESC",
      )
      .all<D1BlogRow>();
    return results.map(d1RowToPost);
  } catch (err) {
    console.error("[blog] getAllPosts fallback to seed:", err);
    return seedPostsFiltered(opts?.includeDrafts);
  }
}

export async function getPostBySlug(
  slug: string,
  opts?: { includeDrafts?: boolean },
): Promise<BlogPost | null> {
  const db = await getDb();
  if (!db) {
    return seedPostBySlug(slug, opts?.includeDrafts);
  }

  try {
    await ensureBlogSchemaAndSeed();
    const row = await db
      .prepare(
        opts?.includeDrafts
          ? "SELECT * FROM blog_posts WHERE slug = ? LIMIT 1"
          : "SELECT * FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1",
      )
      .bind(slug)
      .first<D1BlogRow>();
    return row ? d1RowToPost(row) : null;
  } catch (err) {
    console.error("[blog] getPostBySlug fallback to seed:", err);
    return seedPostBySlug(slug, opts?.includeDrafts);
  }
}

/** Post by its English slug (slug_en). Missing column (migration 0007 not applied yet) -> null. */
export async function getPostBySlugEn(
  slugEn: string,
  opts?: { includeDrafts?: boolean },
): Promise<BlogPost | null> {
  const db = await getDb();
  if (!db) return seedPostBySlug(slugEn, opts?.includeDrafts, "slug_en");
  try {
    await ensureBlogSchemaAndSeed();
    const row = await db
      .prepare(
        opts?.includeDrafts
          ? "SELECT * FROM blog_posts WHERE slug_en = ? LIMIT 1"
          : "SELECT * FROM blog_posts WHERE slug_en = ? AND published = 1 LIMIT 1",
      )
      .bind(slugEn)
      .first<D1BlogRow>();
    return row ? d1RowToPost(row) : null;
  } catch (err) {
    console.error("[blog] getPostBySlugEn:", err);
    return null;
  }
}

/**
 * Is this English slug free for the post `slug`? It must not be another
 * post's slug_en nor another post's Spanish slug (that would shadow the
 * /en/blog/<slug_es> -> slug_en redirect).
 */
export async function isSlugEnAvailable(slugEn: string, slug: string, previousSlug = slug): Promise<boolean> {
  const db = await requireDb();
  const row = await db
    .prepare(
      "SELECT slug FROM blog_posts WHERE (slug_en = ? OR slug = ?) AND slug NOT IN (?, ?) LIMIT 1",
    )
    .bind(slugEn, slugEn, slug, previousSlug)
    .first<{ slug: string }>();
  return !row;
}

/** English slugs in use by other posts (to suggest a free one). */
export async function takenSlugsEn(exceptSlugs: string[]): Promise<string[]> {
  const db = await requireDb();
  const [a, b] = [exceptSlugs[0] ?? "", exceptSlugs[1] ?? exceptSlugs[0] ?? ""];
  const { results } = await db
    .prepare(
      "SELECT slug_en AS s FROM blog_posts WHERE slug NOT IN (?, ?) AND slug_en IS NOT NULL UNION SELECT slug AS s FROM blog_posts WHERE slug NOT IN (?, ?)",
    )
    .bind(a, b, a, b)
    .all<{ s: string }>();
  return results.map((r) => r.s);
}

function upsertStatement(db: Awaited<ReturnType<typeof requireDb>>, post: BlogPost) {
  return db
    .prepare(
      `INSERT INTO blog_posts (
        slug, slug_en, published_at, cover_image, tags, topics,
        title_es, title_en, summary_es, summary_en,
        body_es, body_en, published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (slug) DO UPDATE SET
        slug_en = excluded.slug_en,
        published_at = excluded.published_at,
        cover_image = excluded.cover_image,
        tags = excluded.tags,
        topics = excluded.topics,
        title_es = excluded.title_es,
        title_en = excluded.title_en,
        summary_es = excluded.summary_es,
        summary_en = excluded.summary_en,
        body_es = excluded.body_es,
        body_en = excluded.body_en,
        published = excluded.published,
        updated_at = excluded.updated_at`,
    )
    .bind(
      post.slug,
      post.slugEn || null,
      toIsoDate(post.publishedAt),
      post.coverImage,
      JSON.stringify(post.tags ?? []),
      JSON.stringify(post.topics ?? []),
      post.title.es,
      post.title.en,
      post.summary.es,
      post.summary.en,
      post.body.es,
      post.body.en,
      post.published ? 1 : 0,
      nowIso(),
    );
}

/**
 * Insert or update a post. With `previousSlug` (Spanish slug renamed) the old
 * row is deleted and the new one written in one batch (atomic), so its
 * slug_en never collides with itself on the unique index.
 */
export async function upsertPost(post: BlogPost, previousSlug?: string) {
  await ensureBlogSchemaAndSeed();
  const db = await requireDb();
  if (previousSlug && previousSlug !== post.slug) {
    await db.batch([
      db.prepare("DELETE FROM blog_posts WHERE slug = ?").bind(previousSlug),
      upsertStatement(db, post),
    ]);
    return;
  }
  await upsertStatement(db, post).run();
}

/** Does a post with this Spanish slug exist (drafts included)? */
export async function slugExists(slug: string): Promise<boolean> {
  const db = await requireDb();
  const row = await db.prepare("SELECT 1 AS x FROM blog_posts WHERE slug = ? LIMIT 1").bind(slug).first();
  return Boolean(row);
}

export async function deletePost(slug: string) {
  await ensureBlogSchemaAndSeed();
  const db = await requireDb();
  await db.prepare("DELETE FROM blog_posts WHERE slug = ?").bind(slug).run();
}

/**
 * Headers passed to Better Auth for an admin route. Authorization is removed
 * so a bearer token (the MCP service token, or anything else) cannot satisfy
 * the cookie session check. The session cookie is left as it was.
 */
export function adminSessionHeaders(input: Headers): Headers {
  const h = new Headers(input);
  h.delete("authorization");
  return h;
}

export async function requireAdminSession() {
  const { getAuth } = await import("@/lib/auth/server");
  const { isAdminUser } = await import("@/lib/auth/admin");
  const { headers } = await import("next/headers");

  const auth = await getAuth();
  if (!auth) {
    return { ok: false as const, reason: "auth_not_configured" as const };
  }

  const session = await auth.api.getSession({ headers: adminSessionHeaders(new Headers(await headers())) });
  const user = session?.user;
  if (!user || !isAdminUser(user)) {
    return { ok: false as const, reason: "unauthorized" as const, user };
  }

  return { ok: true as const, user, session };
}

/**
 * Server-render helpers (published only). `cache` dedupes the D1 read between
 * generateMetadata and the page within one request.
 */
export const getPublishedPosts = cache(() => getAllPosts({ includeDrafts: false }));
export const getPublishedPost = cache((slug: string) =>
  getPostBySlug(slug, { includeDrafts: false }),
);
