/**
 * Contratar links keep the visit's campaign tags: /?utm_source=x -> /contratar?utm_source=x.
 * Only utm_* keys pass (lowercase key, non-empty value, max 120 chars each). The base
 * href is server-rendered, so the link works before (or without) JavaScript.
 */
const UTM_KEY = /^utm_[a-z0-9_]{1,40}$/;

export function withUtm(baseHref: string, search: string): string {
  const from = new URLSearchParams(search);
  const [path, hash = ""] = baseHref.split("#");
  const [pathname, query = ""] = path.split("?");
  const out = new URLSearchParams(query);
  let added = false;
  for (const [key, value] of from) {
    if (!UTM_KEY.test(key) || !value || value.length > 120 || out.has(key)) continue;
    out.set(key, value);
    added = true;
  }
  if (!added) return baseHref;
  return `${pathname}?${out.toString()}${hash ? `#${hash}` : ""}`;
}
