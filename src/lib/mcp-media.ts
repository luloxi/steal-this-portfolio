import {
  ASSETS_PUBLIC_ORIGIN,
  MEDIA_EXT,
  MEDIA_MAX,
  getMediaBuckets,
  isMediaKey,
  sniffImage,
  type R2Bucket,
} from "@/lib/media";
import type { McpResult } from "@/lib/mcp-route";

const CACHE = "public, max-age=31536000, immutable";

type Decoded = Uint8Array | "bad" | "big";

function decodeBase64(input: string): Decoded {
  const clean = input.replace(/\s+/g, "");
  if (!clean || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean) || clean.length % 4 !== 0) return "bad";
  const pad = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  const size = (clean.length / 4) * 3 - pad;
  if (size > MEDIA_MAX) return "big";
  let bin: string;
  try {
    bin = atob(clean);
  } catch {
    return "bad";
  }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function checkedBytes(bytes: Uint8Array): McpResult | { type: string; ext: string } {
  if (bytes.byteLength === 0) return { status: 400, body: { error: "no_file" } };
  if (bytes.byteLength > MEDIA_MAX) return { status: 413, body: { error: "too_large", max: MEDIA_MAX } };
  const type = sniffImage(bytes.subarray(0, 64));
  if (!type || !MEDIA_EXT[type]) return { status: 415, body: { error: "unsupported_type" } };
  return { type, ext: MEDIA_EXT[type] };
}

async function readUpload(request: Request): Promise<McpResult | { bytes: Uint8Array }> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    let file: File | null = null;
    try {
      const form = await request.formData();
      const f = form.get("file");
      file = f instanceof File ? f : null;
    } catch {
      return { status: 400, body: { error: "invalid_form" } };
    }
    if (!file || file.size === 0) return { status: 400, body: { error: "no_file" } };
    if (file.size > MEDIA_MAX) return { status: 413, body: { error: "too_large", max: MEDIA_MAX } };
    return { bytes: new Uint8Array(await file.arrayBuffer()) };
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { status: 400, body: { error: "invalid_json" } };
  }
  if (!body || typeof body !== "object") return { status: 400, body: { error: "invalid_json" } };
  const raw = (body as { contentBase64?: unknown }).contentBase64;
  if (typeof raw !== "string" || !raw.trim()) return { status: 400, body: { error: "no_file" } };
  const decoded = decodeBase64(raw);
  if (decoded === "bad") return { status: 400, body: { error: "invalid_file" } };
  if (decoded === "big") return { status: 413, body: { error: "too_large", max: MEDIA_MAX } };
  return { bytes: decoded };
}

/**
 * Store one raster image. Prefers BLOG_ASSETS (public https URL).
 * Falls back to MEDIA (`/media/...`) when that binding is absent.
 */
export async function handleMcpUpload(request: Request, now = new Date()): Promise<McpResult> {
  const read = await readUpload(request);
  if ("status" in read) return read;
  const sniffed = checkedBytes(read.bytes);
  if ("status" in sniffed) return sniffed;

  const key = `blog/${now.getUTCFullYear()}/${crypto.randomUUID()}.${sniffed.ext}`;
  if (!isMediaKey(key)) return { status: 500, body: { error: "storage_not_configured" } };

  const buckets = await getMediaBuckets();
  const target: { bucket: R2Bucket; url: string } | null = buckets.blogAssets
    ? { bucket: buckets.blogAssets, url: `${ASSETS_PUBLIC_ORIGIN}/${key}` }
    : buckets.media
      ? { bucket: buckets.media, url: `/media/${key}` }
      : null;
  if (!target) return { status: 503, body: { error: "storage_not_configured" } };

  const copy = new ArrayBuffer(read.bytes.byteLength);
  new Uint8Array(copy).set(read.bytes);
  await target.bucket.put(key, copy, { httpMetadata: { contentType: sniffed.type, cacheControl: CACHE } });
  return { status: 200, body: { ok: true, url: target.url, key } };
}
