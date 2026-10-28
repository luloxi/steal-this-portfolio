/**
 * Scanner probes (/.env, /%2F.github, /wp-login.php, /aws_credentials.ini ...)
 * never match a real page. Sending them through Next costs a full 404 render plus
 * the proxy's D1 lookups, and a burst of them blew the free-plan CPU limit
 * (Cloudflare "Workers CPU limit exceeded"). worker.ts answers them with a tiny 404 instead.
 *
 * Only paths that can never be a page, an API route or an asset of this site are listed.
 */

// Files a scanner looks for. Nothing in this site serves them.
const PROBE_EXT = /\.(?:php\d?|aspx?|jspx?|cgi|env|ini|ya?ml|bak|old|orig|sql|sqlite3?|db|git|conf|config|toml|pem|key|crt|log|zip|tar|gz|tgz|rar|7z|swp|sh|py|rb|pl|exe)$/i;

// Generic data/script extensions: junk too, except the few real ones below.
const DATA_EXT = /\.(?:json|js|mjs|map|xml|txt)$/i;
const REAL_FILES = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt", "/manifest.json"]);

// Paths where user content or build output lives: never judged by extension.
const SKIP_PREFIXES = ["/.well-known/", "/_next/", "/media/", "/projects/", "/orgs/", "/audio/"];

export function isJunkPath(pathname: string): boolean {
  // Encoded slashes, backslashes, NULs and double encoding (%252f): traversal probes.
  if (/%(?:2f|5c|00|25)/i.test(pathname)) return true;

  const segments = pathname.split("/");
  // Dotfiles and dot-directories (/.git/config, /.env, /.github), but not /.well-known/.
  for (const seg of segments) {
    if (seg.startsWith(".") && seg !== ".well-known" && seg.length > 1) return true;
  }

  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (PROBE_EXT.test(pathname)) return true;
  if (DATA_EXT.test(pathname) && !REAL_FILES.has(pathname)) return true;
  return false;
}
