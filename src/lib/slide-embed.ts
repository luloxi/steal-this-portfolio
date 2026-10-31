/**
 * Google Slides embeds in Markdown: a paragraph that is only a link to an
 * allowlisted presentation URL renders as a responsive iframe. Stored as a
 * plain link ([title](url)), so the Markdown stays safe and readable. Only
 * the parsed id ever reaches the iframe src.
 *
 * Pages on this site do not send a Content-Security-Policy, so there is no
 * frame-src list to extend. The /media image response keeps its own
 * `default-src 'none'` sandbox and is not a document that frames Slides.
 */
export type SlideEmbed = { id: string; embedSrc: string };

const SLIDE_ID = /^[\w-]{20,}$/;

export function parseSlideUrl(href: string | null | undefined): SlideEmbed | null {
  if (!href || typeof href !== "string") return null;
  let u: URL;
  try {
    u = new URL(href.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (u.username || u.password || u.port) return null;
  if (u.hostname !== "docs.google.com") return null;
  const seg = u.pathname.split("/").filter(Boolean);
  if (seg[0] !== "presentation" || seg[1] !== "d") return null;
  const id = seg[2] ?? "";
  if (!SLIDE_ID.test(id)) return null;
  return { id, embedSrc: `https://docs.google.com/presentation/d/${id}/embed` };
}

export const SLIDE_IFRAME_ALLOW = "fullscreen";
