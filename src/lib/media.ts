import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Minimal slice of the R2 binding API used here. */
export type R2ObjectBody = {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
};
export type R2Bucket = {
  put(key: string, value: ArrayBuffer | ReadableStream, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
};

/** Public origin of the Serpix bucket bound as `BLOG_ASSETS` (`serpix-assets`). */
export const ASSETS_PUBLIC_ORIGIN = "https://assets.lulox.com.ar";

export type MediaBuckets = { blogAssets: R2Bucket | null; media: R2Bucket | null };

let bucketsOverride: MediaBuckets | undefined;

/** Unit tests pin the R2 bindings. Production leaves this unset. */
export function setTestMediaBuckets(buckets: MediaBuckets | undefined): void {
  bucketsOverride = buckets;
}

/**
 * `BLOG_ASSETS` (public `serpix-assets`) and `MEDIA` (lulox-media).
 * Either may be missing outside a Worker, or in local dev without the binding.
 */
export async function getMediaBuckets(): Promise<MediaBuckets> {
  if (bucketsOverride) return bucketsOverride;
  try {
    const { env } = await getCloudflareContext({ async: true });
    const e = env as unknown as { MEDIA?: R2Bucket; BLOG_ASSETS?: R2Bucket };
    return { blogAssets: e.BLOG_ASSETS ?? null, media: e.MEDIA ?? null };
  } catch {
    return { blogAssets: null, media: null };
  }
}

/** R2 binding `MEDIA` (bucket lulox-media, see wrangler.jsonc), or null outside a Worker. */
export async function getMedia(): Promise<R2Bucket | null> {
  return (await getMediaBuckets()).media;
}

/** Raster images only (no SVG: it can carry script). */
export const MEDIA_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
export const MEDIA_MAX = 8 * 1024 * 1024;

/** Keys we create look like blog/2026/<uuid>.<ext>; anything else is rejected. */
export function isMediaKey(key: string): boolean {
  return /^blog\/\d{4}\/[0-9a-f-]{36}\.(png|jpg|webp|gif|avif)$/.test(key);
}

/**
 * https image URLs the MCP may attach to a draft:
 * `assets.lulox.com.ar/blog/<year>/<uuid>.<ext>` or
 * `lulox.com.ar/media/blog/<year>/<uuid>.<ext>`.
 * No credentials, no explicit port, no other host.
 */
export function isAllowedBlogImageUrl(raw: string): boolean {
  if (typeof raw !== "string") return false;
  const value = raw.trim();
  if (!value || /[\s()\\]/.test(value)) return false;
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  if (u.username || u.password || u.port) return false;
  let key = "";
  if (u.hostname === "assets.lulox.com.ar") {
    key = u.pathname.replace(/^\//, "");
  } else if (u.hostname === "lulox.com.ar" && u.pathname.startsWith("/media/")) {
    key = u.pathname.slice("/media/".length);
  } else {
    return false;
  }
  return isMediaKey(key);
}

/** Checks magic bytes so a renamed file can't pass as an image. */
export function sniffImage(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  const s = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
  if (s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return "image/webp";
  if (s(4, 4) === "ftyp" && /^avi[fs]$/.test(s(8, 4))) return "image/avif";
  return null;
}
