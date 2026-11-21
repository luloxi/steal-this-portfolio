/**
 * Small WebP copies of images the landing shows tiny (56-76 px), so mobile
 * doesn't download the full-size originals. Unknown paths pass through.
 * Regenerate with Pillow when an original changes (same file name + size suffix).
 */
const THUMBS: Readonly<Record<string, string>> = {
  "/projects/garpen.v8.png": "/projects/thumbs/garpen.v8.112.webp",
  "/projects/tarask.v3.png": "/projects/thumbs/tarask.v3.112.webp",
  "/projects/malito.v5.png": "/projects/thumbs/malito.v5.112.webp",
  "/avatar-hero.jpg": "/avatar-hero.160.webp",
};

export function thumb(src: string): string {
  return THUMBS[src] ?? src;
}
