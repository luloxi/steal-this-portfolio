import test from "node:test";
import assert from "node:assert/strict";
import { insertJob, insertStory, jobsAfterStory, parseLayout, removeStory, serializeLayout } from "../src/lib/page-layout.ts";
import { deleteSection, insertSection, splitSections } from "../src/lib/md-sections.ts";

const DEF = "story:0,story:1,job:2,story:2,job:1,story:3,job:0,story:4,story:5";

test("default layout places jobs after the right stories", () => {
  const m = jobsAfterStory(parseLayout(DEF, 6, 3));
  assert.deepEqual([...m.entries()], [[1, [2]], [2, [1]], [3, [0]]]);
});
test("missing items are appended, bad tokens ignored", () => {
  assert.equal(serializeLayout(parseLayout("job:1,nope,story:9,story:0", 2, 2)), "job:1,story:0,story:1,job:0");
});
test("insert story shifts later stories, insert job lands after existing jobs", () => {
  const l = parseLayout(DEF, 6, 3);
  assert.equal(serializeLayout(insertStory(l, 1)), "story:0,story:1,job:2,story:2,story:3,job:1,story:4,job:0,story:5,story:6");
  assert.equal(serializeLayout(insertJob(l, 1, 3)), "story:0,story:1,job:2,job:3,story:2,job:1,story:3,job:0,story:4,story:5");
});
test("removeStory undoes insertStory and keeps jobs and publications", () => {
  const l = parseLayout(DEF, 6, 3);
  assert.equal(serializeLayout(removeStory(insertStory(l, 1), 2)), serializeLayout(l));
  const withPubs = "story:0,story:1,job:2,story:2,job:1,story:3,job:0,story:4,pubs:0,story:5";
  const placed = parseLayout(withPubs, 6, 3, 1);
  assert.equal(serializeLayout(removeStory(placed, 4)), "story:0,story:1,job:2,story:2,job:1,story:3,job:0,pubs:0,story:4");
});
test("insert then delete a story lines the body up with the layout", () => {
  const md = "intro\n\n## A\n\na\n\n## B\n\nb";
  const layout = parseLayout("story:0,story:1", 2, 0, 0);
  const body = insertSection(md, 1, "N", "n");
  const placed = insertStory(layout, 0);
  assert.deepEqual(splitSections(body).sections.map((s) => s.title), ["A", "N", "B"]);
  assert.equal(serializeLayout(placed), "story:0,story:1,story:2");
  assert.deepEqual(splitSections(deleteSection(body, 1)).sections.map((s) => s.title), ["A", "B"]);
  assert.equal(serializeLayout(removeStory(placed, 1)), "story:0,story:1");
});
test("insertSection keeps other sections intact", () => {
  const md = "intro\n\n## A\n\na\n\n## B\n\nb";
  const out = insertSection(md, 1, "N", "n");
  assert.deepEqual(splitSections(out).sections.map((s) => s.title), ["A", "N", "B"]);
  assert.ok(out.includes("## A\n\na\n\n## N\n\nn\n\n## B\n\nb"));
});
