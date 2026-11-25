/**
 * Generic page layout: an ordered list mixing story sections and records
 * (jobs, the publications block), stored as one editable string:
 * "story:0,job:2,story:1,pubs:0,...".
 * Story order always follows the Markdown body; the layout places records
 * between stories. Unknown/missing items are tolerated (white-label safe).
 */
export type LayoutItem = { kind: "story" | "job" | "pubs" | "talks"; index: number };

/**
 * pubs: how many publication blocks the page has (0 or 1); unplaced ones go after the last story.
 * talks: same for the talks block (0 or 1); an unplaced one goes at the very end.
 */
export function parseLayout(raw: string | undefined, stories: number, jobs: number, pubs = 0, talks = 0): LayoutItem[] {
  const seenS = new Set<number>();
  const seenJ = new Set<number>();
  const seenP = new Set<number>();
  const seenT = new Set<number>();
  const out: LayoutItem[] = [];
  for (const tok of (raw ?? "").split(",")) {
    const m = /^\s*(story|job|pubs|talks):(\d+)\s*$/.exec(tok);
    if (!m) continue;
    const kind = m[1] as LayoutItem["kind"];
    const index = Number(m[2]);
    const max = kind === "story" ? stories : kind === "job" ? jobs : kind === "pubs" ? pubs : talks;
    const seen = kind === "story" ? seenS : kind === "job" ? seenJ : kind === "pubs" ? seenP : seenT;
    if (index >= max || seen.has(index)) continue;
    seen.add(index);
    out.push({ kind, index });
  }
  // Stories missing from the layout keep body order; unplaced jobs go last.
  for (let i = 0; i < stories; i++) if (!seenS.has(i)) out.push({ kind: "story", index: i });
  // An unplaced publications block goes right after the last story (before unplaced jobs).
  for (let i = 0; i < pubs; i++) {
    if (seenP.has(i)) continue;
    let at = out.length;
    for (let k = out.length - 1; k >= 0; k--) if (out[k].kind === "story") { at = k + 1; break; }
    out.splice(at, 0, { kind: "pubs", index: i });
  }
  for (let i = 0; i < jobs; i++) if (!seenJ.has(i)) out.push({ kind: "job", index: i });
  for (let i = 0; i < talks; i++) if (!seenT.has(i)) out.push({ kind: "talks", index: i });
  return out;
}

/**
 * Move one block up (-1) or down (+1). Records just change place in the list.
 * Two stories trade places in the Markdown body instead (story order is the
 * body's order), so the list keeps its story indexes and `swapStories` says
 * which two body sections to swap. Out of range = null.
 */
export function moveBlock(items: LayoutItem[], from: number, dir: -1 | 1): { items: LayoutItem[]; swapStories: [number, number] | null } | null {
  const to = from + dir;
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return null;
  const a = items[from];
  const b = items[to];
  if (a.kind === "story" && b.kind === "story") {
    return { items: items.slice(), swapStories: [a.index, b.index] };
  }
  const out = items.slice();
  out[from] = b;
  out[to] = a;
  return { items: out, swapStories: null };
}

export function serializeLayout(items: LayoutItem[]): string {
  return items.map((x) => `${x.kind}:${x.index}`).join(",");
}

/** Jobs grouped by the story they follow (-1 = before the first story). */
export function jobsAfterStory(items: LayoutItem[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  let last = -1;
  for (const it of items) {
    if (it.kind === "story") last = it.index;
    else if (it.kind === "job") map.set(last, [...(map.get(last) ?? []), it.index]);
  }
  return map;
}

/** Records (jobs, publications) in layout order, grouped by the story they follow (-1 = before the first story). */
export function recordsAfterStory(items: LayoutItem[]): Map<number, LayoutItem[]> {
  const map = new Map<number, LayoutItem[]>();
  let last = -1;
  for (const it of items) {
    if (it.kind === "story") last = it.index;
    else map.set(last, [...(map.get(last) ?? []), it]);
  }
  return map;
}

/** Position right after story `after` (-1 = top), past records already placed there. */
function slotIndex(items: LayoutItem[], after: number): number {
  let pos = after < 0 ? 0 : items.findIndex((x) => x.kind === "story" && x.index === after) + 1;
  while (pos < items.length && items[pos].kind !== "story") pos++;
  return pos;
}

/** New story becomes section after+1: later story indexes shift by one. */
export function insertStory(items: LayoutItem[], after: number): LayoutItem[] {
  const pos = slotIndex(items, after);
  const shifted = items.map((x) => (x.kind === "story" && x.index > after ? { ...x, index: x.index + 1 } : x));
  shifted.splice(pos, 0, { kind: "story", index: after + 1 });
  return shifted;
}

export function insertJob(items: LayoutItem[], after: number, jobIndex: number): LayoutItem[] {
  const pos = slotIndex(items, after);
  const out = [...items];
  out.splice(pos, 0, { kind: "job", index: jobIndex });
  return out;
}
