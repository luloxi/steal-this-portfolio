/** Shared by the /contratar form (client) and the server handler. Counted in characters (code points). */
export const MAX_MESSAGE = 280;
/** Subsidy reason, only when that toggle is on. */
export const MAX_SUBSIDY_REASON = 140;

/** Characters as people see them for the limit: code points (an emoji counts 1, not 2 UTF-16 units). */
export const charCount = (s: string) => [...s].length;

/**
 * Enforces the limit by code point (native maxLength counts UTF-16 units, so it's not used).
 * `event`: "trimmed" when the change went over the limit and got cut (paste or typing past it),
 * "limit" when it just reached the limit exactly, otherwise null.
 */
export function clampMessage(prev: string, next: string, max = MAX_MESSAGE): { value: string; event: "trimmed" | "limit" | null } {
  const chars = [...next];
  if (chars.length > max) return { value: chars.slice(0, max).join(""), event: "trimmed" };
  if (chars.length === max && charCount(prev) < max) return { value: next, event: "limit" };
  return { value: next, event: null };
}
