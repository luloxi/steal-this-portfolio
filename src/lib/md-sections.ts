/**
 * Split a Markdown body at top-level "## " headings, losslessly:
 * joinSections(splitSections(md)) === md. Used by the Sobre mí accordion and
 * by the admin per-section editor (rewrite one section, keep the rest exact).
 */
export type RawSection = { heading: string; title: string; lines: string[] };
export type SplitMd = { intro: string[]; sections: RawSection[] };

const HEADING = /^##[ \t]+(.+?)[ \t#]*$/;

export function splitSections(md: string): SplitMd {
  const lines = md.split("\n");
  const intro: string[] = [];
  const sections: RawSection[] = [];
  let fence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const m = !fence ? HEADING.exec(line) : null;
    if (m) sections.push({ heading: line, title: m[1], lines: [] });
    else if (sections.length) sections[sections.length - 1].lines.push(line);
    else intro.push(line);
  }
  return { intro, sections };
}

export function joinSections({ intro, sections }: SplitMd): string {
  const out = [...intro];
  for (const s of sections) out.push(s.heading, ...s.lines);
  return out.join("\n");
}

/** Split raw section text into leading blank lines, editable core, trailing whitespace. */
function parts(lines: string[]) {
  const m = /^((?:[ \t]*\n)*)([\s\S]*?)(\s*)$/.exec(lines.join("\n"))!;
  return { lead: m[1], core: m[2], trail: m[3] };
}

/** Section body as shown in the editor: without surrounding blank lines. */
export function sectionBody(s: RawSection): string {
  return parts(s.lines).core;
}

function cleanTitle(t: string) {
  return t.replace(/[\r\n]+/g, " ").trim();
}

/** Lines for a section written from the editor: blank line after the heading and before the next one. */
function bodyLines(body: string, last: boolean): string[] {
  const b = body.replace(/\r\n?/g, "\n").replace(/^\n+|\s+$/g, "");
  const lines = ["", ...(b ? b.split("\n") : [])];
  if (!last) lines.push("");
  return lines;
}

/** Replace section i (title + body). i === sections.length appends a new section. */
export function upsertSection(md: string, i: number, title: string, body: string): string {
  const split = splitSections(md);
  const t = cleanTitle(title);
  if (!t) throw new Error("empty_title");
  const n = split.sections.length;
  if (i >= n) {
    // New last section: make sure the previous block ends with a blank line.
    const prev = n ? split.sections[n - 1].lines : split.intro;
    while (prev.length && prev[prev.length - 1].trim() === "") prev.pop();
    if (prev.length || n) prev.push("");
    split.sections.push({ heading: `## ${t}`, title: t, lines: bodyLines(body, true) });
  } else {
    const old = split.sections[i];
    const heading = cleanTitle(old.title) === t ? old.heading : `## ${t}`;
    // Keep the section's own surrounding whitespace; replace only the core text.
    const p = parts(old.lines);
    const core = body.replace(/\r\n?/g, "\n").replace(/^(?:[ \t]*\n)+/, "").replace(/\s+$/, "");
    const lines = p.core || p.lead || p.trail ? (p.lead + core + p.trail).split("\n") : bodyLines(body, i === n - 1);
    split.sections[i] = { heading, title: t, lines };
  }
  return joinSections(split);
}

export function replaceIntro(md: string, intro: string): string {
  const split = splitSections(md);
  const b = intro.replace(/\r\n?/g, "\n").replace(/^\n+|\s+$/g, "");
  const p = parts(split.intro);
  if (p.core && b) split.intro = (p.lead + b + p.trail).split("\n");
  else split.intro = b ? [...b.split("\n"), ...(split.sections.length ? [""] : [])] : [];
  return joinSections(split);
}

export function deleteSection(md: string, i: number): string {
  const split = splitSections(md);
  split.sections.splice(i, 1);
  const out = joinSections(split);
  return out.replace(/\n{3,}$/,"\n").replace(/\s+$/, "");
}

export function introBody(md: string): string {
  return parts(splitSections(md).intro).core;
}

/** Insert a new section so it becomes section `at` (0-based); later sections shift down. */
export function insertSection(md: string, at: number, title: string, body: string): string {
  const split = splitSections(md);
  const n = split.sections.length;
  if (at >= n) return upsertSection(md, n, title, body);
  const t = cleanTitle(title);
  if (!t) throw new Error("empty_title");
  const at0 = Math.max(0, at);
  const prev = at0 > 0 ? split.sections[at0 - 1].lines : split.intro;
  if (prev.length && prev[prev.length - 1].trim() !== "") prev.push("");
  split.sections.splice(at0, 0, { heading: `## ${t}`, title: t, lines: bodyLines(body, false) });
  return joinSections(split);
}

/**
 * Swap two "## " sections, keeping every line of both. Each section that ends
 * up before another one ends with a blank line, so headings stay separated;
 * the last one keeps the body's original trailing whitespace.
 */
export function swapSections(md: string, a: number, b: number): string {
  const split = splitSections(md);
  const n = split.sections.length;
  if (a === b || a < 0 || b < 0 || a >= n || b >= n) return md;
  const trailOf = (lines: string[]) => {
    let k = lines.length;
    while (k > 0 && lines[k - 1].trim() === "") k--;
    return { core: lines.slice(0, k), trail: lines.slice(k) };
  };
  const lastTrail = trailOf(split.sections[n - 1].lines).trail;
  const secs = split.sections.map((s) => ({ ...s, lines: trailOf(s.lines).core }));
  [secs[a], secs[b]] = [secs[b], secs[a]];
  split.sections = secs.map((s, i) => ({ ...s, lines: i === n - 1 ? [...s.lines, ...lastTrail] : [...s.lines, ""] }));
  return joinSections(split);
}
