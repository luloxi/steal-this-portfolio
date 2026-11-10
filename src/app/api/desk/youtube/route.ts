import { NextResponse } from "next/server";
import { collectVideos, decodeEntities, parseYouTubeRef, thumbnailFor, type YtItem } from "@/desktop/youtube";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, max-age=300" };

async function innertube(path: "search" | "browse", body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`https://www.youtube.com/youtubei/v1/${path}?prettyPrint=false`, {
    method: "POST",
    headers: { "content-type": "application/json", "accept-language": "es" },
    body: JSON.stringify({
      context: { client: { clientName: "WEB", clientVersion: "2.20241126.01.00", hl: "es" } },
      ...body,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`youtube ${res.status}`);
  return res.json();
}

async function oembed(videoId: string): Promise<YtItem> {
  const watch = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error("oembed");
    const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    return {
      videoId,
      title: decodeEntities(data.title || videoId),
      channel: decodeEntities(data.author_name || ""),
      thumbnail: data.thumbnail_url || thumbnailFor(videoId),
    };
  } catch {
    return { videoId, title: videoId, channel: "", thumbnail: thumbnailFor(videoId) };
  }
}

async function piped(q: string): Promise<YtItem[]> {
  const res = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("piped");
  const data = (await res.json()) as { items?: { type?: string; url?: string; title?: string; thumbnail?: string; uploaderName?: string }[] } | { type?: string; url?: string; title?: string; thumbnail?: string; uploaderName?: string }[];
  const items = Array.isArray(data) ? data : data.items ?? [];
  const out: YtItem[] = [];
  for (const item of items) {
    if (item.type && item.type !== "stream") continue;
    const id = item.url?.match(/[?&]v=([\w-]{11})/)?.[1] ?? item.url?.match(/\/watch\/([\w-]{11})/)?.[1];
    if (!id) continue;
    out.push({
      videoId: id,
      title: decodeEntities(item.title || id),
      channel: decodeEntities(item.uploaderName || ""),
      thumbnail: item.thumbnail || thumbnailFor(id),
    });
    if (out.length >= 12) break;
  }
  return out;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 160) ?? "";
  if (!q) return NextResponse.json({ ok: false, items: [], error: "empty" }, { status: 400 });
  try {
    const ref = parseYouTubeRef(q);
    if (ref?.playlistId) {
      const json = await innertube("browse", { browseId: `VL${ref.playlistId}` });
      let items = collectVideos(json, 40);
      if (ref.videoId && !items.some((item) => item.videoId === ref.videoId)) {
        items = [await oembed(ref.videoId), ...items];
      }
      return NextResponse.json({ ok: true, items }, { headers: NO_STORE });
    }
    if (ref?.videoId) {
      return NextResponse.json({ ok: true, items: [await oembed(ref.videoId)] }, { headers: NO_STORE });
    }
    try {
      const json = await innertube("search", { query: q });
      const items = collectVideos(json, 12);
      if (items.length) return NextResponse.json({ ok: true, items }, { headers: NO_STORE });
    } catch {
      /* try the public fallback */
    }
    const items = await piped(q);
    return NextResponse.json({ ok: items.length > 0, items, error: items.length ? undefined : "search_unavailable" }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, items: [], error: "search_unavailable" }, { status: 200, headers: NO_STORE });
  }
}
