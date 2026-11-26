import test from "node:test";
import assert from "node:assert/strict";
import { moveBlock, parseLayout, serializeLayout, talksInTimeline } from "../src/lib/page-layout.ts";
import { splitSections, swapSections } from "../src/lib/md-sections.ts";
import { applyCopy, flattenCopy } from "../src/i18n/copy-overrides.ts";
import { landingCopy } from "../src/i18n/landing.ts";

const md = "Intro line *\n\n## A\n\nalpha **one**\n\n## B\n\nbeta\n\n- x\n- y\n\n## C\n\ngamma";
const chars = (s: string) => s.replace(/\s+/g, "").split("").sort().join("");

test("swapSections trades two chapters and keeps every character", () => {
  const out = swapSections(md, 0, 1);
  assert.deepEqual(splitSections(out).sections.map((s) => s.title), ["B", "A", "C"]);
  assert.equal(chars(out), chars(md));
  assert.ok(out.startsWith("Intro line *\n\n## B\n\nbeta\n\n- x\n- y\n\n## A\n\nalpha **one**\n\n## C"));
  // The last chapter moving up still gets a blank line before the next heading.
  const last = swapSections(md, 1, 2);
  assert.match(last, /gamma\n\n## B/);
  assert.equal(chars(last), chars(md));
  // Swapping back restores the same chapters in the same order.
  assert.deepEqual(splitSections(swapSections(out, 0, 1)).sections.map((s) => s.title), ["A", "B", "C"]);
  assert.equal(swapSections(md, 0, 9), md);
});

test("talks block: unplaced goes last, placed stays put", () => {
  assert.equal(serializeLayout(parseLayout("story:0,story:1", 2, 1, 1, 1)), "story:0,story:1,pubs:0,job:0,talks:0");
  assert.equal(serializeLayout(parseLayout("talks:0,story:0,story:1", 2, 0, 0, 1)), "talks:0,story:0,story:1");
  assert.doesNotMatch(serializeLayout(parseLayout("talks:0,story:0", 1, 0)), /talks/);
});

test("moveBlock: records swap places, two stories ask for a body swap", () => {
  const l = parseLayout("story:0,job:0,story:1,pubs:0", 2, 1, 1, 1);
  const a = moveBlock(l, 1, 1)!;
  assert.equal(serializeLayout(a.items), "story:0,story:1,job:0,pubs:0,talks:0");
  assert.equal(a.swapStories, null);
  const b = moveBlock(parseLayout("story:0,story:1,job:0", 2, 1), 0, 1)!;
  assert.deepEqual(b.swapStories, [0, 1]);
  assert.equal(serializeLayout(b.items), "story:0,story:1,job:0");
  assert.equal(moveBlock(l, 0, -1), null);
  assert.equal(moveBlock(l, l.length - 1, 1), null);
});

test("landing texts are editable keys with code fallback, both languages", () => {
  for (const loc of ["es", "en"] as const) {
    const keys = flattenCopy({ landing: landingCopy(loc) });
    for (const k of ["landing.home.hero.title", "landing.home.hero.lead", "landing.home.paths.diy.title", "landing.home.process.steps.0.title", "landing.home.featured.items.2.solves", "landing.home.faq.items.0.q", "landing.more.about.body", "landing.home.end.title"]) {
      assert.ok(k in keys, `${loc} ${k}`);
    }
    // SEO meta stays in code.
    assert.ok(!Object.keys(keys).some((k) => k.startsWith("landing.home.meta")));
    const edited = applyCopy({ landing: landingCopy(loc) }, { "landing.home.hero.title": "Nuevo", "about.body": "x" }).landing;
    assert.equal(edited.home.hero.title, "Nuevo");
    assert.equal(landingCopy(loc).home.hero.title !== "Nuevo", true);
    // Old keys saved in D1 before the two-paths home (lead, kicker, closing) no longer touch it.
    const old = applyCopy({ landing: landingCopy(loc) }, { "landing.home.lead": "viejo", "landing.home.kicker": ".", "landing.home.closing": "viejo" }).landing;
    assert.deepEqual(old, landingCopy(loc));
  }
  // The English landing says AI, never IA.
  assert.doesNotMatch(Object.values(flattenCopy(landingCopy("en"))).join(" "), /\bIA\b/);
});

test("individual talks: talks:0 expands, empty block is dropped, placement among jobs is a milestone", () => {
  // Unplaced talks become talk:N at the end (or where talks:0 sat).
  assert.equal(serializeLayout(parseLayout("story:0,story:1", 2, 1, 1, 1, 1)), "story:0,story:1,pubs:0,job:0,talk:0");
  assert.equal(serializeLayout(parseLayout("talks:0,story:0", 1, 0, 0, 1, 2)), "talk:0,talk:1,story:0");
  assert.equal(serializeLayout(parseLayout("story:0,job:0,talk:0", 1, 1, 0, 1, 1)), "story:0,job:0,talk:0");
  // A leftover talks:0 with every talk already placed disappears.
  assert.equal(serializeLayout(parseLayout("story:0,talk:0,talks:0", 1, 0, 0, 1, 1)), "story:0,talk:0");
  const among = parseLayout("story:0,job:0,talk:0,job:1", 1, 2, 0, 1, 1);
  assert.deepEqual([...talksInTimeline(among)], [0]);
  const leftover = parseLayout("story:0,job:0,story:1,talk:0", 2, 1, 0, 1, 1);
  assert.equal(talksInTimeline(leftover).size, 0);
  // Two talks next to a job are both milestones; a later unplaced one stays out.
  const mixed = parseLayout("story:0,job:0,talk:0,story:1", 2, 1, 0, 1, 2);
  assert.deepEqual([...talksInTimeline(mixed)], [0]);
  assert.match(serializeLayout(mixed), /story:1,talk:1$/);
});

test("moveBlock can walk a talk into the experience group", () => {
  const l = parseLayout("story:0,job:0,story:1,talk:0", 2, 1, 0, 1, 1);
  assert.equal(talksInTimeline(l).size, 0);
  const up = moveBlock(l, 3, -1)!;
  assert.equal(serializeLayout(up.items), "story:0,job:0,talk:0,story:1");
  assert.deepEqual([...talksInTimeline(up.items)], [0]);
});

