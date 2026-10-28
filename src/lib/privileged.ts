/**
 * Accounts marked "sin límite" in the Personalizar panel are never cut off by the
 * request rate limit (worker.ts). The owner (ADMIN_EMAILS) is always exempt.
 * Stored in D1 `site_settings` under one key, as a newline-separated list of emails.
 */
export const PRIVILEGED_KEY = "privileged_emails";
export const PRIVILEGED_MAX = 50;

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export function parsePrivileged(text: string): string[] {
  const out: string[] = [];
  for (const part of text.split(/[\s,;]+/)) {
    const email = part.trim().toLowerCase();
    if (email.length > 0 && email.length <= 254 && EMAIL.test(email) && !out.includes(email)) out.push(email);
    if (out.length >= PRIVILEGED_MAX) break;
  }
  return out;
}

export function formatPrivileged(emails: readonly string[]): string {
  return emails.join("\n");
}

export function isPrivileged(email: string | null | undefined, stored: string | null | undefined): boolean {
  const who = (email ?? "").trim().toLowerCase();
  if (!who) return false;
  return parsePrivileged(stored ?? "").includes(who);
}
