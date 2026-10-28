/**
 * Section routes and config that is not site content.
 * Name, socials, colors and the booking link live in D1 (`site_settings`).
 * The Turnstile site key is public config. The secret is TURNSTILE_SECRET_KEY.
 */

export const turnstileSiteKey = "0x4AAAAAAFhUYfv6XY9bzY__";

export type SectionId =
  | "about"
  | "projects"
  | "blog"
  | "tastes"
  | "contact"
  | "hire"
  | "referrals";

/** Main sections - stacked Linktree-style buttons */
export const sections = [
  { id: "hire" as const, href: "/contratar" },
  { id: "blog" as const, href: "/blog" },
  { id: "about" as const, href: "/sobre-mi" },
  { id: "projects" as const, href: "/proyectos" },
  { id: "contact" as const, href: "/contacto" },
  /** Only shown to signed-in users (landing); the page itself is public. */
  { id: "referrals" as const, href: "/referidos" },
];
