/**
 * Admin edit-mode toggle, shared by client and server. The client keeps it in
 * localStorage and mirrors it to a cookie so server pages (blog) can read it.
 * Default is ON; only an explicit "off" turns it off.
 */
export const EDIT_MODE_KEY = "lulox-edit-mode";

export function editModeFromCookie(cookieHeader: string | null | undefined): boolean {
  const m = new RegExp(`(?:^|;\\s*)${EDIT_MODE_KEY}=([^;]*)`).exec(cookieHeader ?? "");
  return m?.[1] !== "off";
}

/** Drafts are shown only to an admin with edit mode ON; otherwise exactly as a visitor. */
export function canSeeDrafts(isAdmin: boolean, cookieHeader: string | null | undefined): boolean {
  return isAdmin && editModeFromCookie(cookieHeader);
}

export function editModeCookie(on: boolean): string {
  return `${EDIT_MODE_KEY}=${on ? "on" : "off"}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * Proxy-side draft gate (/en/blog/<slug>): same rule as /blog (admin AND edit mode ON).
 * The allowlist check (isAdmin) only runs when there is a session cookie and edit mode
 * isn't off, so visitors and plain signed-in users never trigger a draft lookup.
 */
export async function mayLookUpDrafts(
  hasSessionCookie: boolean,
  cookieHeader: string | null | undefined,
  isAdmin: () => Promise<boolean>,
): Promise<boolean> {
  if (!hasSessionCookie || !editModeFromCookie(cookieHeader)) return false;
  return isAdmin();
}

/**
 * The owner opened a blog article with edit mode OFF (for example right after
 * creating it): show the one-button "Activar modo editor" prompt. Never for
 * visitors or signed-in non-owners.
 */
export function shouldOfferEditMode(isAdmin: boolean, editOn: boolean): boolean {
  return isAdmin && !editOn;
}
