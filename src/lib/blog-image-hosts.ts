/**
 * Hosts next/image may load for a blog cover.
 * Body images use a plain <img> and are not limited by this list.
 * Production on Cloudflare serves images unoptimized; this still lets `next dev` render them.
 */
export const BLOG_IMAGE_REMOTE_PATTERNS = [
  {
    protocol: "https" as const,
    hostname: "assets.lulox.com.ar",
    pathname: "/blog/**",
  },
  {
    protocol: "https" as const,
    hostname: "lulox.com.ar",
    pathname: "/media/**",
  },
];
