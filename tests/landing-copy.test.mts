import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILT_ART, CASE_HUMAN_STEP, homeCopy } from "../src/content/home-copy.ts";
import { flattenCopy } from "../src/i18n/copy-overrides.ts";

test("landing copy has the same shape in both languages", () => {
  const es = homeCopy.es;
  const en = homeCopy.en;
  assert.equal(es.faq.items.length, 7);
  assert.equal(en.faq.items.length, es.faq.items.length);
  assert.equal(es.cases.items.length, 4);
  assert.equal(en.cases.items.length, es.cases.items.length);
  assert.equal(es.built.items.length, 6);
  assert.equal(en.built.items.length, es.built.items.length);
  assert.equal(BUILT_ART.length, es.built.items.length);
  assert.equal(es.trust.items.length, 3);
  assert.deepEqual(Object.keys(flattenCopy(es)).sort(), Object.keys(flattenCopy(en)).sort());
  es.cases.items.forEach((it, i) => {
    assert.equal(en.cases.items[i].flow.length, it.flow.length);
    assert.ok(CASE_HUMAN_STEP[i] < it.flow.length);
  });
});

test("landing copy: short hero, no freelancer pitch, no stack names, no em dashes", () => {
  assert.equal(homeCopy.es.title, "Que el trabajo repetitivo de tu negocio se haga solo.");
  assert.equal(homeCopy.en.title, "Let your business's repetitive work get done on its own.");
  for (const loc of ["es", "en"] as const) {
    const text = Object.values(flattenCopy(homeCopy[loc])).join(" ");
    assert.doesNotMatch(text, /freelanc|independientes|n8n|Next\.js|Cloudflare/i);
    assert.doesNotMatch(text, /\u2014/);
  }
  assert.doesNotMatch(Object.values(flattenCopy(homeCopy.en)).join(" "), /\bIA\b/);
});
