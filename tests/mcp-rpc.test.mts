import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDraft,
  getPost,
  listPosts,
  mapMcpHttp,
  publishPost,
  uploadImage,
  type McpFetcher,
} from "../src/lib/mcp-rpc.ts";

const SECRET = "mcp-rpc-test-secret-value";
const root = fileURLToPath(new URL("..", import.meta.url));

function scripted(status: number, body: unknown, raw?: string) {
  const seen: Request[] = [];
  const fetcher: McpFetcher = async (request) => {
    seen.push(request);
    if (raw !== undefined) return new Response(raw, { status, headers: { "content-type": "text/plain" } });
    return Response.json(body, { status });
  };
  return { seen, fetcher };
}

async function jsonBody(request: Request) {
  return await request.json() as unknown;
}

test("mapMcpHttp strips ok and maps status codes without leaking the body", () => {
  assert.deepEqual(mapMcpHttp(200, { ok: true, url: "https://assets.lulox.com.ar/a.png", key: "blog/2026/a.png" }), {
    ok: true,
    data: { url: "https://assets.lulox.com.ar/a.png", key: "blog/2026/a.png" },
  });
  assert.deepEqual(mapMcpHttp(201, { ok: true, slug: "hola", published: false }), {
    ok: true,
    data: { slug: "hola", published: false },
  });
  assert.deepEqual(mapMcpHttp(400, { error: "confirm_required" }), {
    ok: false,
    error: { code: "invalid", message: "confirm_required" },
  });
  assert.deepEqual(mapMcpHttp(400, { error: "invalid_post", detail: SECRET }), {
    ok: false,
    error: { code: "invalid", message: "invalid_post" },
  });
  assert.deepEqual(mapMcpHttp(409, { error: "slug_taken" }), {
    ok: false,
    error: { code: "invalid", message: "slug_taken" },
  });
  assert.deepEqual(mapMcpHttp(404, { error: "not_found" }), {
    ok: false,
    error: { code: "not_found", message: "not_found" },
  });
  assert.deepEqual(mapMcpHttp(401, { error: "unauthorized", hint: SECRET }), {
    ok: false,
    error: { code: "not_enabled", message: "blog MCP not configured" },
  });
  assert.deepEqual(mapMcpHttp(503, { error: "storage_not_configured", sql: "SELECT " + SECRET }), {
    ok: false,
    error: { code: "not_enabled", message: "blog MCP not configured" },
  });
  assert.deepEqual(mapMcpHttp(500, { error: SECRET, stack: "Error: SELECT " + SECRET + " FROM blog_posts" }), {
    ok: false,
    error: { code: "internal", message: "internal error" },
  });
  assert.deepEqual(mapMcpHttp(415, { error: "unsupported_type" }), {
    ok: false,
    error: { code: "internal", message: "internal error" },
  });
  assert.deepEqual(mapMcpHttp(400, { error: SECRET }), {
    ok: false,
    error: { code: "invalid", message: "invalid" },
  });
  const blob = JSON.stringify(mapMcpHttp(500, { error: SECRET, message: "near " + SECRET }));
  assert.equal(blob.includes(SECRET), false);
  assert.equal(blob.includes("SELECT"), false);
});

test("uploadImage posts JSON contentBase64 to /api/mcp/media", async () => {
  const { seen, fetcher } = scripted(200, { ok: true, url: "https://assets.lulox.com.ar/blog/2026/a.png", key: "blog/2026/a.png" });
  const result = await uploadImage(fetcher, SECRET, { filename: "foto.png", contentBase64: "aG9sYQ==", extra: SECRET });
  assert.deepEqual(result, { ok: true, data: { url: "https://assets.lulox.com.ar/blog/2026/a.png", key: "blog/2026/a.png" } });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].method, "POST");
  assert.equal(seen[0].url, "https://lulox.com.ar/api/mcp/media");
  assert.equal(seen[0].headers.get("authorization"), `Bearer ${SECRET}`);
  assert.equal(seen[0].headers.get("content-type"), "application/json");
  assert.deepEqual(await jsonBody(seen[0]), { filename: "foto.png", contentBase64: "aG9sYQ==" });
});

test("createDraft posts the draft fields and maps 409 slug_taken to invalid", async () => {
  const draft = {
    title: { es: "Hola", en: "Hi" },
    summary: { es: "b" },
    body: { es: "cuerpo" },
    slug: "hola",
    tags: ["a"],
    topics: ["x"],
    coverImage: "",
    images: [{ url: "https://assets.lulox.com.ar/blog/2026/a.png", alt: "alt" }],
    slides: [{ url: "https://docs.google.com/presentation/d/abc/edit", title: "Deck" }],
    published: true,
    token: SECRET,
  };
  const ok = scripted(200, {
    ok: true,
    slug: "hola",
    slugEn: null,
    published: false,
    needsTranslation: false,
    previewUrl: "/blog/hola",
  });
  const created = await createDraft(ok.fetcher, SECRET, draft);
  assert.deepEqual(created, {
    ok: true,
    data: { slug: "hola", slugEn: null, published: false, needsTranslation: false, previewUrl: "/blog/hola" },
  });
  assert.equal(ok.seen[0].method, "POST");
  assert.equal(ok.seen[0].url, "https://lulox.com.ar/api/mcp/posts");
  assert.equal(ok.seen[0].headers.get("authorization"), `Bearer ${SECRET}`);
  assert.deepEqual(await jsonBody(ok.seen[0]), {
    title: draft.title,
    summary: draft.summary,
    body: draft.body,
    slug: "hola",
    tags: ["a"],
    topics: ["x"],
    coverImage: "",
    images: draft.images,
    slides: draft.slides,
  });

  const taken = scripted(409, { error: "slug_taken", detail: "UNIQUE " + SECRET });
  const conflict = await createDraft(taken.fetcher, SECRET, { title: { es: "Hola" }, slug: "hola" });
  assert.deepEqual(conflict, { ok: false, error: { code: "invalid", message: "slug_taken" } });
  assert.equal(JSON.stringify(conflict).includes(SECRET), false);
});

test("publishPost requires literal boolean true and sends confirm true", async () => {
  let calls = 0;
  const fetcher: McpFetcher = async () => {
    calls += 1;
    return Response.json({ ok: true, slug: "hola", slugEn: "hi", published: true, alreadyPublished: false });
  };
  for (const confirm of [undefined, false, "true", 1, null]) {
    const result = await publishPost(fetcher, SECRET, { slug: "hola", confirm });
    assert.deepEqual(result, { ok: false, error: { code: "invalid", message: "confirm_required" } });
  }
  assert.deepEqual(await publishPost(fetcher, SECRET, { confirm: true }), {
    ok: false,
    error: { code: "invalid", message: "invalid_slug" },
  });
  assert.equal(calls, 0);

  const { seen, fetcher: okFetch } = scripted(200, {
    ok: true,
    slug: "hola",
    slugEn: "hi",
    published: true,
    alreadyPublished: false,
  });
  const published = await publishPost(okFetch, SECRET, { slug: "hola", confirm: true, note: SECRET });
  assert.deepEqual(published, {
    ok: true,
    data: { slug: "hola", slugEn: "hi", published: true, alreadyPublished: false },
  });
  assert.equal(seen[0].method, "POST");
  assert.equal(seen[0].url, "https://lulox.com.ar/api/mcp/posts/hola/publish");
  assert.equal(seen[0].headers.get("authorization"), `Bearer ${SECRET}`);
  assert.deepEqual(await jsonBody(seen[0]), { confirm: true });

  const again = scripted(200, { ok: true, slug: "hola", slugEn: "hi", published: true, alreadyPublished: true });
  const second = await publishPost(again.fetcher, SECRET, { slug: "hola", confirm: true });
  assert.equal(second.ok, true);
  if (second.ok) assert.equal(second.data.alreadyPublished, true);
});

test("listPosts and getPost map drafts, items and a missing post", async () => {
  const listed = scripted(200, { posts: [{ slug: "hola", published: false }] });
  const page = await listPosts(listed.fetcher, SECRET, { drafts: true });
  assert.deepEqual(page, { ok: true, data: { items: [{ slug: "hola", published: false }] } });
  assert.equal(listed.seen[0].method, "GET");
  assert.equal(listed.seen[0].url, "https://lulox.com.ar/api/mcp/posts?drafts=1");
  assert.equal(listed.seen[0].headers.get("authorization"), `Bearer ${SECRET}`);
  assert.equal(listed.seen[0].headers.get("content-type"), null);

  const publishedOnly = scripted(200, { posts: [] });
  await listPosts(publishedOnly.fetcher, SECRET, { drafts: false });
  await listPosts(publishedOnly.fetcher, SECRET, {});
  await listPosts(publishedOnly.fetcher, SECRET, undefined);
  assert.deepEqual(publishedOnly.seen.map((request) => request.url), [
    "https://lulox.com.ar/api/mcp/posts",
    "https://lulox.com.ar/api/mcp/posts",
    "https://lulox.com.ar/api/mcp/posts",
  ]);

  const one = scripted(200, { post: { slug: "hola", published: false, title: { es: "Hola" } } });
  const post = await getPost(one.fetcher, SECRET, { slug: "hola" });
  assert.deepEqual(post, { ok: true, data: { slug: "hola", published: false, title: { es: "Hola" } } });
  assert.equal(one.seen[0].url, "https://lulox.com.ar/api/mcp/posts/hola");

  const missing = scripted(404, { error: "not_found", secret: SECRET });
  const gone = await getPost(missing.fetcher, SECRET, { slug: "no-esta" });
  assert.deepEqual(gone, { ok: false, error: { code: "not_found", message: "not_found" } });
  assert.equal(JSON.stringify(gone).includes(SECRET), false);
});

test("unset token is not_enabled and the fetcher is not called", async () => {
  let calls = 0;
  const fetcher: McpFetcher = async () => {
    calls += 1;
    return Response.json({ ok: true });
  };
  const expected = { ok: false as const, error: { code: "not_enabled" as const, message: "blog MCP not configured" } };
  assert.deepEqual(await uploadImage(fetcher, undefined, { contentBase64: "aa" }), expected);
  assert.deepEqual(await uploadImage(fetcher, "", { contentBase64: "aa" }), expected);
  assert.deepEqual(await createDraft(fetcher, undefined, { title: { es: "A" } }), expected);
  assert.deepEqual(await publishPost(fetcher, undefined, { slug: "hola", confirm: true }), expected);
  assert.deepEqual(await publishPost(fetcher, "   ", { slug: "hola", confirm: "true" }), expected);
  assert.deepEqual(await listPosts(fetcher, undefined, { drafts: true }), expected);
  assert.deepEqual(await getPost(fetcher, undefined, { slug: "hola" }), expected);
  assert.equal(calls, 0);
  assert.equal(JSON.stringify(expected).includes("MCP_SERVICE_TOKEN"), false);
});

test("thrown errors and non-JSON bodies stay generic and omit the secret", async () => {
  const thrown = await uploadImage(async () => {
    throw new Error("SQLITE_ERROR near " + SECRET);
  }, SECRET, { contentBase64: "qq" });
  assert.deepEqual(thrown, { ok: false, error: { code: "internal", message: "internal error" } });
  assert.equal(JSON.stringify(thrown).includes(SECRET), false);
  assert.equal(JSON.stringify(thrown).includes("SQLITE"), false);

  const { fetcher } = scripted(500, null, "SELECT " + SECRET + " FROM blog_posts");
  const crashed = await listPosts(fetcher, SECRET, {});
  assert.deepEqual(crashed, { ok: false, error: { code: "internal", message: "internal error" } });
  assert.equal(JSON.stringify(crashed).includes(SECRET), false);
  assert.equal(JSON.stringify(crashed).includes("SELECT"), false);
});

test("McpRpc is a named WorkerEntrypoint and the logic module stays pure", () => {
  const worker = readFileSync(join(root, "worker.ts"), "utf8");
  assert.match(worker, /import \{ WorkerEntrypoint \} from "cloudflare:workers"/);
  assert.match(worker, /export class McpRpc extends WorkerEntrypoint\b/);
  const start = worker.indexOf("export class McpRpc");
  const end = worker.indexOf("export default");
  const body = worker.slice(start, end);
  for (const name of ["uploadImage", "createDraft", "publishPost", "listPosts", "getPost"]) {
    assert.match(body, new RegExp("\\b" + name + "\\("));
  }
  assert.match(worker, /handler\.fetch\(request, env, ctx\)/);
  assert.equal(worker.slice(end).includes("McpRpc"), false);
  const source = readFileSync(join(root, "src/lib/mcp-rpc.ts"), "utf8");
  assert.equal(source.includes("cloudflare:"), false);
  assert.equal(source.includes("next/"), false);
  assert.equal(source.includes("getCloudflareContext"), false);
  assert.equal(source.includes(SECRET), false);
});
