/** Blog index: Publicados/Borradores selector, visitor exclusion, and path after deleting a draft. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { BlogPost } from "../src/content/blog/types.ts";
import {
  BLOG_LIST_VIEW_KEY,
  blogListPath,
  filterBlogPosts,
  parseBlogListView,
} from "../src/lib/blog-list.ts";

const post = (slug: string, published: boolean, date: string, title = slug): BlogPost => ({
  slug,
  slugEn: `${slug}-en`,
  publishedAt: date,
  coverImage: "",
  tags: [slug],
  published,
  title: { es: title, en: `${title} EN` },
  summary: { es: `resumen ${slug}`, en: `summary ${slug}` },
  body: { es: `cuerpo ${slug}`, en: `body ${slug}` },
});

const published = post("pub-a", true, "2026-11-20", "Publicado A");
const olderPub = post("pub-b", true, "2026-10-01", "Publicado B");
const draft = post("borrador-x", false, "2026-11-22", "Borrador X");
const olderDraft = post("borrador-y", false, "2026-09-01", "Borrador Y");
const all = [olderDraft, published, draft, olderPub];

test("parseBlogListView: only 'drafts' is drafts, default is published", () => {
  assert.equal(parseBlogListView("drafts"), "drafts");
  assert.equal(parseBlogListView("published"), "published");
  assert.equal(parseBlogListView(null), "published");
  assert.equal(parseBlogListView(""), "published");
  assert.equal(parseBlogListView("ghosts"), "published");
});

test("visitors and edit-off never see drafts, even if the view is drafts", () => {
  const rows = filterBlogPosts(all, { editOn: false, view: "drafts" });
  assert.deepEqual(rows.map((p) => p.slug), ["pub-a", "pub-b"]);
  const visitor = filterBlogPosts(all, { editOn: false, view: "published" });
  assert.ok(visitor.every((p) => p.published));
  assert.equal(visitor.some((p) => p.slug === "borrador-x"), false);
});

test("edit mode: Publicados hides drafts, Borradores hides published, newest first", () => {
  assert.deepEqual(
    filterBlogPosts(all, { editOn: true, view: "published" }).map((p) => p.slug),
    ["pub-a", "pub-b"],
  );
  assert.deepEqual(
    filterBlogPosts(all, { editOn: true, view: "drafts" }).map((p) => p.slug),
    ["borrador-x", "borrador-y"],
  );
});

test("search still works inside each view", () => {
  const found = filterBlogPosts(all, { editOn: true, view: "drafts", query: "Borrador X" });
  assert.deepEqual(found.map((p) => p.slug), ["borrador-x"]);
  const none = filterBlogPosts(all, { editOn: true, view: "drafts", query: "Publicado" });
  assert.deepEqual(none, []);
});

test("after deleting a draft, the list URL is the drafts view in both languages", () => {
  assert.equal(blogListPath("es", "drafts"), "/blog?view=drafts");
  assert.equal(blogListPath("en", "drafts"), "/en/blog?view=drafts");
  assert.equal(blogListPath("es", "published"), "/blog");
  assert.equal(blogListPath("en"), "/en/blog");
  assert.equal(BLOG_LIST_VIEW_KEY, "lulox-blog-list");
});

test("the blog page only loads drafts for the owner with edit mode on (server-side)", () => {
  const src = readFileSync(new URL("../src/app/blog/page.tsx", import.meta.url), "utf8");
  assert.match(src, /canSeeDraftsRequest/);
  assert.match(src, /getPublishedPosts/);
  assert.match(src, /includeDrafts: true/);
  assert.match(src, /getPublishedPosts\(\)/);
});

test("the post page 404s a draft for visitors (published-only read)", () => {
  const src = readFileSync(new URL("../src/app/blog/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(src, /canSeeDraftsRequest/);
  assert.match(src, /getPublishedPost/);
});
