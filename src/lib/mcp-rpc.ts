// Blog McpRpc. Pure logic (no Next.js or Cloudflare imports) so node:test can load it.
// worker.ts owns the WorkerEntrypoint and passes handler.fetch in as the fetcher.

export type RpcErrorCode = "no_owner" | "invalid" | "not_found" | "not_enabled" | "internal";
export type RpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: RpcErrorCode; message: string } };

export type McpFetcher = (request: Request) => Response | Promise<Response>;

export type UploadImageResult = { url: string; key: string };
export type DraftResult = {
  slug: string;
  slugEn: string | null;
  published: false;
  needsTranslation: boolean;
  previewUrl: string;
};
export type PublishResult = {
  slug: string;
  slugEn: string | null;
  published: true;
  alreadyPublished: boolean;
};

const ORIGIN = "https://lulox.com.ar";
const NOT_CONFIGURED = "blog MCP not configured";
const INTERNAL_MESSAGE = "internal error";
const MAX_BODY = 2_000_000;
const TOKEN_MAX = 512;

const DRAFT_KEYS = ["title", "summary", "body", "slug", "tags", "topics", "coverImage", "images", "slides"] as const;

function fail(code: RpcErrorCode, message: string): RpcResult<never> {
  return { ok: false, error: { code, message } };
}

function notEnabled(): RpcResult<never> {
  return fail("not_enabled", NOT_CONFIGURED);
}

function internal(): RpcResult<never> {
  return fail("internal", INTERNAL_MESSAGE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** A configured secret: non-empty, header-safe, within the bearer limit. Whitespace-only counts as unset. */
function tokenOk(token: string | undefined): token is string {
  if (typeof token !== "string" || token.length === 0 || token.length > TOKEN_MAX) return false;
  if (token.trim().length === 0 || /[\r\n]/.test(token)) return false;
  return true;
}

/** Error codes we are willing to show. Anything else (stacks, SQL, secrets) is dropped. */
function safeErrorCode(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const error = body.error;
  if (typeof error !== "string" || !/^[a-z][a-z0-9_]{0,40}$/.test(error)) return null;
  return error;
}

/**
 * HTTP status from /api/mcp/* to RpcResult.
 * 2xx: parsed object with `ok` removed. 400 and 409: invalid (message is the error code).
 * 404: not_found. 401 and 503: not_enabled. Anything else: internal, generic message.
 */
export function mapMcpHttp(status: number, body: unknown): RpcResult<Record<string, unknown>> {
  if (status >= 200 && status < 300) {
    if (!isRecord(body)) return internal();
    const data = { ...body };
    delete data.ok;
    return { ok: true, data };
  }
  if (status === 400 || status === 409) return fail("invalid", safeErrorCode(body) ?? "invalid");
  if (status === 404) return fail("not_found", safeErrorCode(body) ?? "not_found");
  if (status === 401 || status === 503) return notEnabled();
  return internal();
}

function scrub(result: RpcResult<Record<string, unknown>>, token: string): RpcResult<Record<string, unknown>> {
  if (result.ok || token.length < 20 || !result.error.message.includes(token)) return result;
  if (result.error.code === "not_enabled") return notEnabled();
  if (result.error.code === "not_found") return fail("not_found", "not_found");
  if (result.error.code === "invalid") return fail("invalid", "invalid");
  return internal();
}

type Read = { kind: "json"; value: unknown } | { kind: "bad" };

async function readJson(response: Response): Promise<Read> {
  try {
    const text = await response.text();
    if (text.length > MAX_BODY) return { kind: "bad" };
    if (!text.trim()) return { kind: "json", value: null };
    return { kind: "json", value: JSON.parse(text) as unknown };
  } catch {
    return { kind: "bad" };
  }
}

async function dispatch(fetcher: McpFetcher, token: string | undefined, request: Request): Promise<RpcResult<Record<string, unknown>>> {
  if (!tokenOk(token)) return notEnabled();
  try {
    const response = await fetcher(request);
    if (!response || typeof response.status !== "number") return internal();
    const read = await readJson(response);
    const mapped = mapMcpHttp(response.status, read.kind === "json" ? read.value : null);
    return scrub(mapped, token);
  } catch {
    return internal();
  }
}

function authHeaders(token: string, json: boolean): Headers {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  if (json) headers.set("content-type", "application/json");
  return headers;
}

function pick(input: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) body[key] = input[key];
  }
  return body;
}

function postUrl(path: string): string {
  return `${ORIGIN}${path}`;
}

function slugOf(input: Record<string, unknown>): string | null {
  if (typeof input.slug !== "string" || input.slug.length === 0 || input.slug.length > 200) return null;
  if (/[\\/\0?#]/.test(input.slug)) return null;
  return input.slug;
}

export function uploadImage(fetcher: McpFetcher, token: string | undefined, input: unknown): Promise<RpcResult<UploadImageResult>> {
  if (!tokenOk(token)) return Promise.resolve(notEnabled());
  if (!isRecord(input)) return Promise.resolve(fail("invalid", "invalid_json"));
  const request = new Request(postUrl("/api/mcp/media"), {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(pick(input, ["filename", "contentBase64"])),
  });
  return dispatch(fetcher, token, request).then((result) => {
    if (!result.ok) return result;
    const { url, key } = result.data;
    if (typeof url !== "string" || typeof key !== "string") return internal();
    return { ok: true, data: { url, key } };
  });
}

export function createDraft(fetcher: McpFetcher, token: string | undefined, input: unknown): Promise<RpcResult<DraftResult>> {
  if (!tokenOk(token)) return Promise.resolve(notEnabled());
  if (!isRecord(input)) return Promise.resolve(fail("invalid", "invalid_post"));
  const request = new Request(postUrl("/api/mcp/posts"), {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(pick(input, DRAFT_KEYS)),
  });
  return dispatch(fetcher, token, request).then((result) => {
    if (!result.ok) return result;
    const { slug, slugEn, published, needsTranslation, previewUrl } = result.data;
    if (typeof slug !== "string") return internal();
    if (typeof slugEn !== "string" && slugEn !== null) return internal();
    if (published !== false) return internal();
    if (typeof needsTranslation !== "boolean" || typeof previewUrl !== "string") return internal();
    return { ok: true, data: { slug, slugEn, published: false, needsTranslation, previewUrl } };
  });
}

export function publishPost(fetcher: McpFetcher, token: string | undefined, input: unknown): Promise<RpcResult<PublishResult>> {
  if (!tokenOk(token)) return Promise.resolve(notEnabled());
  if (!isRecord(input) || input.confirm !== true) return Promise.resolve(fail("invalid", "confirm_required"));
  const slug = slugOf(input);
  if (!slug) return Promise.resolve(fail("invalid", "invalid_slug"));
  const request = new Request(postUrl(`/api/mcp/posts/${encodeURIComponent(slug)}/publish`), {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify({ confirm: true }),
  });
  return dispatch(fetcher, token, request).then((result) => {
    if (!result.ok) return result;
    const { slug: outSlug, slugEn, published, alreadyPublished } = result.data;
    if (typeof outSlug !== "string") return internal();
    if (typeof slugEn !== "string" && slugEn !== null) return internal();
    if (published !== true || typeof alreadyPublished !== "boolean") return internal();
    return { ok: true, data: { slug: outSlug, slugEn, published: true, alreadyPublished } };
  });
}

export function listPosts(fetcher: McpFetcher, token: string | undefined, input: unknown): Promise<RpcResult<{ items: unknown[] }>> {
  if (!tokenOk(token)) return Promise.resolve(notEnabled());
  if (input !== undefined && !isRecord(input)) return Promise.resolve(fail("invalid", "invalid"));
  const drafts = isRecord(input) && input.drafts === true;
  const request = new Request(postUrl(drafts ? "/api/mcp/posts?drafts=1" : "/api/mcp/posts"), {
    method: "GET",
    headers: authHeaders(token, false),
  });
  return dispatch(fetcher, token, request).then((result) => {
    if (!result.ok) return result;
    const posts = result.data.posts;
    if (!Array.isArray(posts)) return internal();
    return { ok: true, data: { items: posts } };
  });
}

export function getPost(fetcher: McpFetcher, token: string | undefined, input: unknown): Promise<RpcResult<Record<string, unknown>>> {
  if (!tokenOk(token)) return Promise.resolve(notEnabled());
  if (!isRecord(input)) return Promise.resolve(fail("invalid", "invalid_slug"));
  const slug = slugOf(input);
  if (!slug) return Promise.resolve(fail("invalid", "invalid_slug"));
  const request = new Request(postUrl(`/api/mcp/posts/${encodeURIComponent(slug)}`), {
    method: "GET",
    headers: authHeaders(token, false),
  });
  return dispatch(fetcher, token, request).then((result) => {
    if (!result.ok) return result;
    const post = result.data.post;
    if (!isRecord(post)) return internal();
    return { ok: true, data: post };
  });
}
