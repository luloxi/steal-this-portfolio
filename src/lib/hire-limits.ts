/** Shared by the /contratar form (client) and the server handler. Counted in characters (code points). */
export const MAX_MESSAGE = 1000;

/** Characters as people see them for the limit: code points (an emoji counts 1, not 2 UTF-16 units). */
export const charCount = (s: string) => [...s].length;

/** Cuts a value to the limit by code point (native maxLength counts UTF-16 units, so it's not used). */
export function clampMessage(next: string, max = MAX_MESSAGE): string {
  const chars = [...next];
  return chars.length > max ? chars.slice(0, max).join("") : next;
}
