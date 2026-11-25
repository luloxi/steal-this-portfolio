import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTalkPeriod, TALKS } from "../src/content/talks.ts";

test("talks link out over https and the English copy never says IA", () => {
  assert.ok(TALKS.length > 0);
  for (const t of TALKS) {
    assert.match(t.url, /^https:\/\//);
    const en = `${t.en.before}${t.en.link}${t.en.after}`;
    assert.doesNotMatch(en, /\bIA\b/);
    for (const ph of t.image ? [t.image, ...t.photos] : t.photos) {
      assert.match(ph.src, /\.webp$/);
      assert.ok(ph.alt.es.trim() && ph.alt.en.trim());
    }
  }
});

test("talk dates format like experience periods", () => {
  assert.equal(formatTalkPeriod("2025-04-10", "es"), "Abr 2025");
  assert.equal(formatTalkPeriod("2025-04-10", "en"), "Apr 2025");
  assert.equal(formatTalkPeriod("2023-12-01", "es"), "Dic 2023");
  assert.equal(formatTalkPeriod("not-a-date", "en"), "not-a-date");
});

