/** YouTube ids, oEmbed-safe titles, and a walker for Innertube JSON. */

export type YtItem = { videoId: string; title: string; channel: string; thumbnail: string };

const VIDEO_ID = /^[\w-]{11}$/;

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function parseYouTubeRef(input: string): { videoId?: string; playlistId?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (VIDEO_ID.test(trimmed)) return { videoId: trimmed };
  if (/^(PL|UU|OL|RD|FL)[\w-]{8,}$/.test(trimmed)) return { playlistId: trimmed };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  if (host !== "youtube.com" && host !== "youtu.be" && host !== "youtube-nocookie.com") return null;
  const list = url.searchParams.get("list") || undefined;
  let videoId: string | undefined;
  if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0];
  else if (url.pathname === "/watch") videoId = url.searchParams.get("v") || undefined;
  else {
    const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
    if (match) videoId = match[1];
  }
  if (videoId && !VIDEO_ID.test(videoId)) videoId = undefined;
  const playlistId = list && /^[\w-]{8,}$/.test(list) ? list : undefined;
  if (!videoId && !playlistId) return null;
  return { videoId, playlistId };
}

function textOf(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const rec = node as { simpleText?: string; runs?: { text?: string }[] };
  if (typeof rec.simpleText === "string") return rec.simpleText;
  if (Array.isArray(rec.runs)) return rec.runs.map((r) => r.text ?? "").join("");
  return "";
}

export function collectVideos(node: unknown, limit = 40): YtItem[] {
  const out: YtItem[] = [];
  const seen = new Set<string>();
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object" || out.length >= limit) return;
    const rec = value as Record<string, unknown>;
    const video = (rec.videoRenderer ?? rec.playlistVideoRenderer) as
      | { videoId?: string; title?: unknown; ownerText?: unknown; shortBylineText?: unknown; thumbnail?: { thumbnails?: { url?: string }[] } }
      | undefined;
    const id = video?.videoId;
    if (id && VIDEO_ID.test(id) && !seen.has(id)) {
      seen.add(id);
      const thumbs = video?.thumbnail?.thumbnails ?? [];
      out.push({
        videoId: id,
        title: decodeEntities(textOf(video?.title) || id),
        channel: decodeEntities(textOf(video?.ownerText) || textOf(video?.shortBylineText)),
        thumbnail: thumbs[thumbs.length - 1]?.url || thumbnailFor(id),
      });
    }
    for (const child of Object.values(rec)) {
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === "object") walk(child);
    }
  };
  walk(node);
  return out;
}
