/** Deleting a blog draft: by Spanish or English slug, missing row, published row left alone. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { d1 } from "./d1-sqlite.mts";

const db = d1(["0001_init.sql", "0003_post_topics.sql", "0007_blog_slug_en.sql"]);
const { setTestDb } = await import("../src/lib/db.ts");
setTestDb(db);
const blog = await import("../src/lib/blog.ts");

function insert(slug: string, slugEn: string | null, published: 0 | 1) {
  db.raw.prepare(
    `INSERT INTO blog_posts (
      slug, slug_en, published_at, title_es, title_en,
      summary_es, summary_en, body_es, body_en, published
    ) VALUES (?, ?, '2026-11-25T00:00:00.000Z', ?, 'T', '', '', '', '', ?)`,
  ).run(slug, slugEn, slug, published);
}

function exists(slug: string) {
  return Boolean(db.raw.prepare("SELECT 1 AS x FROM blog_posts WHERE slug = ?").get(slug));
}

test("deletePost removes a draft by its Spanish slug and leaves other posts", async () => {
  insert("pub-keep", "pub-keep-en", 1);
  insert("test-draft-delete-me", null, 0);
  assert.equal(await blog.deletePost("test-draft-delete-me"), true);
  assert.equal(exists("test-draft-delete-me"), false);
  assert.equal(exists("pub-keep"), true);
});

test("deletePost removes a draft when given its English slug", async () => {
  insert("borrador-con-en", "a-draft-with-an-english-slug", 0);
  assert.equal(await blog.deletePost("a-draft-with-an-english-slug"), true);
  assert.equal(exists("borrador-con-en"), false);
});

test("deletePost returns false when the slug is missing, and does not touch others", async () => {
  insert("still-here", "still-here-en", 0);
  assert.equal(await blog.deletePost("no-existe"), false);
  assert.equal(exists("still-here"), true);
});

test("deletePost also deletes a published post (same path; the UI is what limits this)", async () => {
  insert("pub-to-delete", "pub-to-delete-en", 1);
  assert.equal(await blog.deletePost("pub-to-delete"), true);
  assert.equal(exists("pub-to-delete"), false);
});

test("the editor no longer refreshes the deleted draft URL, and lands on the drafts list", () => {
  const src = readFileSync(new URL("../src/components/blog-post-edit.tsx", import.meta.url), "utf8");
  const del = src.slice(src.indexOf("const del ="), src.indexOf("const cancelExtra"));
  assert.match(del, /blogListPath\(L, "drafts"\)/);
  assert.match(del, /router\.replace\(blogListPath/);
  assert.doesNotMatch(del, /window\.confirm/);
  // A refresh of the current (just-deleted) route 404s the draft and can swallow navigation.
  assert.doesNotMatch(del, /router\.refresh\(\)/);
});

test("DELETE /api/blog without a session is 401", async () => {
  const { DELETE } = await import("../src/app/api/blog/route.ts");
  const res = await DELETE(new Request("https://lulox.com.ar/api/blog?slug=test-draft-delete-me", { method: "DELETE" }));
  assert.equal(res.status, 401);
});
