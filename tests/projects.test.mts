/** DJTube is the first past project and the only live one. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DJTUBE_URL, pastProjectIds, pastProjects } from "../src/content/projects.ts";
import { PROJECT_KEYS } from "../src/lib/site-sections.ts";

const FORBIDDEN = [
  "experimento",
  "a medias",
  "prototipo",
  "beta",
  "experiment",
  "half-finished",
  "prototype",
];

test("djtube is first, live, and the only live project", () => {
  assert.equal(pastProjects[0]?.id, "djtube");
  assert.deepEqual(
    pastProjects.filter((p) => p.status === "live").map((p) => p.id),
    ["djtube"],
  );
  const dj = pastProjects[0]!;
  assert.equal(dj.github, "https://github.com/luloxi/djtube");
  assert.equal(dj.liveUrl, "https://dj.lulox.com.ar");
  assert.equal(dj.liveUrl, DJTUBE_URL);
  assert.equal(dj.icon, "/projects/djtube.svg");
  assert.equal(dj.disabledReason, undefined);
});

test("djtube copy is filled in es and en, without the forbidden words", () => {
  const dj = pastProjects.find((p) => p.id === "djtube");
  assert.ok(dj);
  for (const locale of ["es", "en"] as const) {
    const copy = dj.copy[locale];
    assert.ok(copy.title.trim(), locale);
    assert.ok(copy.body.trim(), locale);
    assert.ok(copy.paragraphs.length > 0, locale);
    assert.ok(copy.paragraphs.every((p) => p.trim().length > 0), locale);
    const blob = [copy.title, copy.body, ...copy.paragraphs, copy.awards].join("\n").toLowerCase();
    for (const word of FORBIDDEN) {
      assert.equal(blob.includes(word), false, `${locale} contains "${word}"`);
    }
  }
});

test("PROJECT_KEYS stays in lockstep with pastProjectIds", () => {
  assert.deepEqual(PROJECT_KEYS, pastProjectIds);
  assert.equal(pastProjectIds[0], "djtube");
});
