import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { d1 } from "./d1-sqlite.mts";

const TOKEN = "mcp-test-token";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const SVG = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
const IMG = "https://assets.lulox.com.ar/blog/2026/123e4567-e89b-12d3-a456-426614174000.png";
const IMG_MEDIA = "https://lulox.com.ar/media/blog/2026/123e4567-e89b-12d3-a456-426614174001.webp";
const SLIDE = "https://docs.google.com/presentation/d/abcdefghijklmnopqrst/edit?usp=sharing";

const db = d1([
  "0001_init.sql",
  "0003_post_topics.sql",
  "0007_blog_slug_en.sql",
  "0008_site_sections.sql",
  "0012_projects.sql",
]);

const { setTestDb } = await import("../src/lib/db.ts");
setTestDb(db);
await db.prepare(
  "INSERT INTO blog_posts (slug, published_at, title_es, title_en, summary_es, summary_en, body_es, body_en) VALUES ('__keep__', '2026-01-01T00:00:00.000Z', 'k', 'k', '', '', '', '')",
).run();

const blog = await import("../src/lib/blog.ts");
await blog.getAllPosts({ includeDrafts: true });
await db.prepare("DELETE FROM blog_posts").run();

const { setTestMcpSecret, mcpBearerMatches, clearTestMcpSecret } = await import("../src/lib/mcp-service-auth.ts");
setTestMcpSecret(TOKEN);

const { setTestMediaBuckets, MEDIA_MAX, isAllowedBlogImageUrl } = await import("../src/lib/media.ts");
const { BLOG_IMAGE_REMOTE_PATTERNS } = await import("../src/lib/blog-image-hosts.ts");
const postsRoute = await import("../src/app/api/mcp/posts/route.ts");
const oneRoute = await import("../src/app/api/mcp/posts/[slug]/route.ts");
const publishRoute = await import("../src/app/api/mcp/posts/[slug]/publish/route.ts");
const mediaRoute = await import("../src/app/api/mcp/media/route.ts");
const publicList = await import("../src/app/api/blog/public/route.ts");
const publicOne = await import("../src/app/api/blog/public/[slug]/route.ts");
const adminRoute = await import("../src/app/api/blog/route.ts");
const { buildAuthOptions } = await import("../src/lib/auth/options.ts");

const require = createRequire(import.meta.url);
const { hasRemoteMatch } = require("next/dist/shared/lib/match-remote-pattern.js") as {
  hasRemoteMatch: (domains: string[], patterns: unknown[], url: URL) => boolean;
};

function authed(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("authorization")) headers.set("authorization", `Bearer ${TOKEN}`);
  return new Request(url, { ...init, headers });
}

function row(slug: string) {
  return db.raw.prepare("SELECT * FROM blog_posts WHERE slug = ?").get(slug) as Record<string, unknown> | undefined;
}

async function bodyOf(res: Response) {
  return (await res.json()) as Record<string, unknown>;
}

test("mcp bearer: missing, wrong, unset, and cookie-only are the same 401", async () => {
  const url = "https://lulox.com.ar/api/mcp/posts?drafts=1";
  for (const req of [
    new Request(url),
    new Request(url, { headers: { authorization: "Bearer wrong-token" } }),
    new Request(url, { headers: { cookie: "better-auth.session_token=admin-session" } }),
    new Request(url, { headers: { authorization: "Basic mcp-test-token" } }),
  ]) {
    const res = await postsRoute.GET(req);
    assert.equal(res.status, 401);
    assert.deepEqual(await bodyOf(res), { error: "unauthorized" });
  }

  setTestMcpSecret(undefined);
  try {
    const res = await postsRoute.GET(authed(url));
    assert.equal(res.status, 401);
    assert.deepEqual(await bodyOf(res), { error: "unauthorized" });
    assert.equal(await mcpBearerMatches(`Bearer ${TOKEN}`, ""), false);
    assert.equal(await mcpBearerMatches(`Bearer ${TOKEN}`, undefined), false);
  } finally {
    setTestMcpSecret(TOKEN);
  }

  const subtle = crypto.subtle;
  const orig = subtle.digest.bind(subtle);
  let calls = 0;
  const wrapped = (async (...args: Parameters<SubtleCrypto["digest"]>) => {
    calls += 1;
    return orig(...args);
  }) as SubtleCrypto["digest"];
  Object.defineProperty(subtle, "digest", { configurable: true, value: wrapped });
  try {
    calls = 0;
    assert.equal(await mcpBearerMatches(null, TOKEN), false);
    assert.equal(calls, 2);
    calls = 0;
    assert.equal(await mcpBearerMatches(`Bearer ${TOKEN}`, TOKEN), true);
    assert.equal(calls, 2);
    calls = 0;
    assert.equal(await mcpBearerMatches("Bearer short", "a-much-longer-secret-value"), false);
    assert.equal(calls, 2);
    calls = 0;
    assert.equal(await mcpBearerMatches(`Bearer ${TOKEN}`, undefined), false);
    assert.equal(calls, 0);
  } finally {
    Object.defineProperty(subtle, "digest", { configurable: true, value: orig });
  }
});

test("admin routes ignore the MCP bearer", async () => {
  const headers = blog.adminSessionHeaders(new Headers({
    authorization: `Bearer ${TOKEN}`,
    cookie: "better-auth.session_token=abc",
  }));
  assert.equal(headers.get("authorization"), null);
  assert.equal(headers.get("cookie"), "better-auth.session_token=abc");
  assert.equal(buildAuthOptions({} as never, { BETTER_AUTH_SECRET: "x" }).plugins, undefined);

  const got = await adminRoute.GET();
  assert.equal(got.status, 401);
  const listed = await bodyOf(got);
  assert.equal(listed.posts, undefined);

  const put = await adminRoute.PUT(authed("https://lulox.com.ar/api/blog", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slug: "bearer-must-not-write",
      title: { es: "No", en: "No" },
      published: true,
    }),
  }));
  assert.equal(put.status, 401);
  assert.equal(row("bearer-must-not-write"), undefined);
});

test("route handlers are force-dynamic", () => {
  assert.equal(postsRoute.dynamic, "force-dynamic");
  assert.equal(oneRoute.dynamic, "force-dynamic");
  assert.equal(publishRoute.dynamic, "force-dynamic");
  assert.equal(mediaRoute.dynamic, "force-dynamic");
  assert.equal(typeof postsRoute.GET, "function");
  assert.equal(typeof postsRoute.POST, "function");
  assert.equal(typeof oneRoute.GET, "function");
  assert.equal(typeof publishRoute.POST, "function");
  assert.equal(typeof mediaRoute.POST, "function");
});

test("image URL allowlist and next/image remote patterns", () => {
  assert.equal(isAllowedBlogImageUrl(IMG), true);
  assert.equal(isAllowedBlogImageUrl(IMG_MEDIA), true);
  for (const bad of [
    "http://assets.lulox.com.ar/blog/2026/123e4567-e89b-12d3-a456-426614174000.png",
    "https://user:pw@assets.lulox.com.ar/blog/2026/123e4567-e89b-12d3-a456-426614174000.png",
    "https://assets.lulox.com.ar:444/blog/2026/123e4567-e89b-12d3-a456-426614174000.png",
    "https://assets.lulox.com.ar.evil.com/blog/2026/123e4567-e89b-12d3-a456-426614174000.png",
    "https://evil.example/blog/2026/123e4567-e89b-12d3-a456-426614174000.png",
    "https://assets.lulox.com.ar/blog/2026/not-a-uuid.png",
    "https://lulox.com.ar/blog/2026/123e4567-e89b-12d3-a456-426614174000.png",
    "/media/blog/2026/123e4567-e89b-12d3-a456-426614174000.png",
    "javascript:alert(1)",
  ]) {
    assert.equal(isAllowedBlogImageUrl(bad), false, bad);
  }

  const ok = new URL(IMG);
  const media = new URL(IMG_MEDIA);
  const evil = new URL("https://evil.example/blog/2026/123e4567-e89b-12d3-a456-426614174000.png");
  const otherPath = new URL("https://assets.lulox.com.ar/lulox/logo/v2/icon.png");
  assert.equal(hasRemoteMatch([], BLOG_IMAGE_REMOTE_PATTERNS, ok), true);
  assert.equal(hasRemoteMatch([], BLOG_IMAGE_REMOTE_PATTERNS, media), true);
  assert.equal(hasRemoteMatch([], BLOG_IMAGE_REMOTE_PATTERNS, evil), false);
  assert.equal(hasRemoteMatch([], BLOG_IMAGE_REMOTE_PATTERNS, otherPath), false);
});

test("create draft ignores published:true, copies missing en, and rejects collisions and bad images", async () => {
  const created = await postsRoute.POST(authed("https://lulox.com.ar/api/mcp/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: { es: "Cómo está el blog" },
      summary: { es: "Bajada" },
      body: { es: "Cuerpo" },
      published: true,
      tags: ["uno"],
      topics: ["midnight", "no-such-topic"],
      images: [{ url: IMG, alt: "Portada" }, { url: IMG_MEDIA, caption: "Otra" }],
      slides: [{ url: SLIDE, title: "Deck" }],
    }),
  }));
  assert.equal(created.status, 200);
  const payload = await bodyOf(created);
  assert.equal(payload.ok, true);
  assert.equal(payload.slug, "como-esta-el-blog");
  assert.equal(payload.slugEn, null);
  assert.equal(payload.published, false);
  assert.equal(payload.needsTranslation, true);
  assert.equal(payload.previewUrl, "/blog/como-esta-el-blog");

  const stored = row("como-esta-el-blog");
  assert.ok(stored);
  assert.equal(stored.published, 0);
  assert.equal(stored.title_en, "Cómo está el blog");
  assert.equal(stored.summary_en, "Bajada");
  assert.match(String(stored.body_es), /!\[Portada\]\(https:\/\/assets\.lulox\.com\.ar\//);
  assert.match(String(stored.body_en), /!\[Otra\]\(https:\/\/lulox\.com\.ar\/media\//);
  assert.match(String(stored.body_es), /\[Deck\]\(https:\/\/docs\.google\.com\/presentation\/d\/abcdefghijklmnopqrst\/edit\?usp=sharing\)/);
  assert.equal(stored.cover_image, IMG);
  assert.equal(stored.topics, JSON.stringify(["midnight"]));
  assert.equal(stored.slug_en, null);

  const again = await postsRoute.POST(authed("https://lulox.com.ar/api/mcp/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: { es: "Cómo está el blog", en: "How is the blog" }, summary: { es: "", en: "" }, body: { es: "", en: "" } }),
  }));
  assert.equal(again.status, 200);
  const second = await bodyOf(again);
  assert.equal(second.slug, "como-esta-el-blog-2");
  assert.equal(second.needsTranslation, false);
  assert.equal(second.published, false);

  const taken = await postsRoute.POST(authed("https://lulox.com.ar/api/mcp/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: "como-esta-el-blog", title: { es: "Otro", en: "Other" }, summary: { es: "s", en: "s" }, body: { es: "b", en: "b" } }),
  }));
  assert.equal(taken.status, 409);
  assert.deepEqual(await bodyOf(taken), { error: "slug_taken" });
  assert.equal(row("como-esta-el-blog")?.title_es, "Cómo está el blog");

  await db.prepare("UPDATE blog_posts SET slug_en = ? WHERE slug = ?").bind("shadow-me", "como-esta-el-blog").run();
  const shadow = await postsRoute.POST(authed("https://lulox.com.ar/api/mcp/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: "shadow-me", title: { es: "Sombra", en: "Shadow" } }),
  }));
  assert.equal(shadow.status, 409);

  const badImage = await postsRoute.POST(authed("https://lulox.com.ar/api/mcp/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: { es: "Mala imagen", en: "Bad image" }, images: [{ url: "https://evil.example/a.png" }] }),
  }));
  assert.equal(badImage.status, 400);
  assert.deepEqual(await bodyOf(badImage), { error: "invalid_image_url" });
  assert.equal(row("mala-imagen"), undefined);

  const badSlide = await postsRoute.POST(authed("https://lulox.com.ar/api/mcp/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: { es: "Mala slide", en: "Bad slide" },
      slides: [{ url: "https://docs.google.com/presentation/d/short/edit" }],
    }),
  }));
  assert.equal(badSlide.status, 400);
  assert.equal((await bodyOf(badSlide)).error, "invalid_slide");
  assert.equal(row("mala-slide"), undefined);
});

test("list and get include drafts, publish requires boolean confirm and is idempotent", async () => {
  const hidden = await postsRoute.GET(authed("https://lulox.com.ar/api/mcp/posts"));
  const hiddenBody = await bodyOf(hidden) as { posts: { slug: string }[] };
  assert.ok(!hiddenBody.posts.some((p) => p.slug === "como-esta-el-blog"));

  const listed = await postsRoute.GET(authed("https://lulox.com.ar/api/mcp/posts?drafts=1"));
  const listBody = await bodyOf(listed) as { posts: { slug: string; published: boolean; title: { es: string; en: string }; updated: string | null }[] };
  const draft = listBody.posts.find((p) => p.slug === "como-esta-el-blog");
  assert.ok(draft);
  assert.equal(draft.published, false);
  assert.equal(draft.title.es, "Cómo está el blog");
  assert.equal(typeof draft.updated, "string");

  const one = await oneRoute.GET(authed("https://lulox.com.ar/api/mcp/posts/como-esta-el-blog"), {
    params: Promise.resolve({ slug: "como-esta-el-blog" }),
  });
  assert.equal(one.status, 200);
  const oneBody = await bodyOf(one) as { post: { published: boolean; body: { es: string } } };
  assert.equal(oneBody.post.published, false);
  assert.match(oneBody.post.body.es, /Portada/);

  const noConfirm = await publishRoute.POST(authed("https://lulox.com.ar/api/mcp/posts/como-esta-el-blog/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: "true" }),
  }), { params: Promise.resolve({ slug: "como-esta-el-blog" }) });
  assert.equal(noConfirm.status, 400);
  assert.deepEqual(await bodyOf(noConfirm), { error: "confirm_required" });
  assert.equal(row("como-esta-el-blog")?.published, 0);

  const falseConfirm = await publishRoute.POST(authed("https://lulox.com.ar/api/mcp/posts/como-esta-el-blog/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "nope",
  }), { params: Promise.resolve({ slug: "como-esta-el-blog" }) });
  assert.equal(falseConfirm.status, 400);
  assert.equal(row("como-esta-el-blog")?.published, 0);

  const missing = await publishRoute.POST(authed("https://lulox.com.ar/api/mcp/posts/no-such/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: true }),
  }), { params: Promise.resolve({ slug: "no-such" }) });
  assert.equal(missing.status, 404);

  // The collision case above stored slug_en = shadow-me. Publish assigns one only when missing.
  await db.prepare("UPDATE blog_posts SET slug_en = NULL WHERE slug = ?").bind("como-esta-el-blog").run();

  const published = await publishRoute.POST(authed("https://lulox.com.ar/api/mcp/posts/como-esta-el-blog/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: true }),
  }), { params: Promise.resolve({ slug: "como-esta-el-blog" }) });
  assert.equal(published.status, 200);
  const pubBody = await bodyOf(published);
  assert.equal(pubBody.published, true);
  assert.equal(pubBody.alreadyPublished, false);
  assert.equal(pubBody.slugEn, "como-esta-el-blog");
  assert.equal(row("como-esta-el-blog")?.published, 1);
  assert.equal(row("como-esta-el-blog")?.slug_en, "como-esta-el-blog");

  await db.prepare("UPDATE blog_posts SET updated_at = ? WHERE slug = ?").bind("2000-01-01T00:00:00.000Z", "como-esta-el-blog").run();
  const again = await publishRoute.POST(authed("https://lulox.com.ar/api/mcp/posts/como-esta-el-blog/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: true }),
  }), { params: Promise.resolve({ slug: "como-esta-el-blog" }) });
  assert.equal(again.status, 200);
  const againBody = await bodyOf(again);
  assert.equal(againBody.published, true);
  assert.equal(againBody.alreadyPublished, true);
  assert.equal(row("como-esta-el-blog")?.updated_at, "2000-01-01T00:00:00.000Z");
  assert.equal(row("como-esta-el-blog")?.published, 1);
});

test("drafts stay out of the public API and published-only reads", async () => {
  const made = await postsRoute.POST(authed("https://lulox.com.ar/api/mcp/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: "solo-borrador", title: { es: "Secreto", en: "Secret" }, summary: { es: "s", en: "s" }, body: { es: "b", en: "b" } }),
  }));
  assert.equal(made.status, 200);

  const list = await publicList.GET();
  assert.equal(list.status, 200);
  const posts = ((await bodyOf(list)).posts ?? []) as { slug: string }[];
  assert.ok(posts.some((p) => p.slug === "como-esta-el-blog"));
  assert.ok(!posts.some((p) => p.slug === "solo-borrador"));

  const hidden = await publicOne.GET(new Request("https://lulox.com.ar/api/blog/public/solo-borrador"), {
    params: Promise.resolve({ slug: "solo-borrador" }),
  });
  assert.equal(hidden.status, 404);

  assert.equal(await blog.getPostBySlug("solo-borrador", { includeDrafts: false }), null);
  assert.equal((await blog.getAllPosts({ includeDrafts: false })).some((p) => p.slug === "solo-borrador"), false);
  assert.ok(await blog.getPostBySlug("solo-borrador", { includeDrafts: true }));
  const publishedOnly = await blog.getPublishedPost("solo-borrador");
  assert.equal(publishedOnly, null);
  const visible = await blog.getPublishedPosts();
  assert.ok(visible.some((p) => p.slug === "como-esta-el-blog"));
  assert.ok(!visible.some((p) => p.slug === "solo-borrador"));
});

test("upload accepts PNG bytes, rejects SVG and oversized files", async () => {
  const assets = mockBucket();
  const media = mockBucket();
  setTestMediaBuckets({ blogAssets: assets, media });

  const png = new File([PNG], "evil.svg", { type: "image/svg+xml" });
  const form = new FormData();
  form.set("file", png);
  const ok = await mediaRoute.POST(authed("https://lulox.com.ar/api/mcp/media", { method: "POST", body: form }));
  assert.equal(ok.status, 200);
  const uploaded = await bodyOf(ok);
  assert.equal(uploaded.ok, true);
  assert.match(String(uploaded.url), /^https:\/\/assets\.lulox\.com\.ar\/blog\/\d{4}\/[0-9a-f-]{36}\.png$/);
  assert.match(String(uploaded.key), /^blog\/\d{4}\/[0-9a-f-]{36}\.png$/);
  assert.equal(assets.puts[0]?.contentType, "image/png");
  assert.equal(assets.puts[0]?.cacheControl, "public, max-age=31536000, immutable");
  assert.equal(media.puts.length, 0);

  const svg = new File([SVG], "photo.png", { type: "image/png" });
  const badForm = new FormData();
  badForm.set("file", svg);
  const rejected = await mediaRoute.POST(authed("https://lulox.com.ar/api/mcp/media", { method: "POST", body: badForm }));
  assert.equal(rejected.status, 415);
  assert.deepEqual(await bodyOf(rejected), { error: "unsupported_type" });

  const b64 = Buffer.from(PNG).toString("base64");
  const jsonOk = await mediaRoute.POST(authed("https://lulox.com.ar/api/mcp/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: "x.svg", contentBase64: b64 }),
  }));
  assert.equal(jsonOk.status, 200);
  assert.match(String((await bodyOf(jsonOk)).key), /\.png$/);

  const big = new Uint8Array(MEDIA_MAX + 1);
  big.set(PNG);
  const bigForm = new FormData();
  bigForm.set("file", new File([big], "big.png", { type: "image/png" }));
  const tooBig = await mediaRoute.POST(authed("https://lulox.com.ar/api/mcp/media", { method: "POST", body: bigForm }));
  assert.equal(tooBig.status, 413);
  assert.equal((await bodyOf(tooBig)).error, "too_large");

  setTestMediaBuckets({ blogAssets: null, media });
  const fallbackForm = new FormData();
  fallbackForm.set("file", new File([PNG], "a.png", { type: "image/png" }));
  const fallback = await mediaRoute.POST(authed("https://lulox.com.ar/api/mcp/media", { method: "POST", body: fallbackForm }));
  assert.equal(fallback.status, 200);
  const fb = await bodyOf(fallback);
  assert.match(String(fb.url), /^\/media\/blog\/\d{4}\/[0-9a-f-]{36}\.png$/);
  assert.equal(media.puts.length, 1);

  setTestMediaBuckets(undefined);
  clearTestMcpSecret();
});

function mockBucket() {
  const puts: { key: string; contentType?: string; cacheControl?: string }[] = [];
  return {
    puts,
    async put(key: string, _value: ArrayBuffer | ReadableStream, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string } }) {
      puts.push({ key, contentType: opts?.httpMetadata?.contentType, cacheControl: opts?.httpMetadata?.cacheControl });
    },
    async get() {
      return null;
    },
  };
}
