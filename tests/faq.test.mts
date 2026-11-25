import test from "node:test";
import assert from "node:assert/strict";
import { faqToText, FAQ_MAX_ITEMS, parseStoredFaq, seedFaq, validateFaqItems } from "../src/lib/faq.ts";
import { homeCopy } from "../src/content/home-copy.ts";
import { LLMS_FULL_AFTER_FAQ, LLMS_FULL_BEFORE_FAQ } from "../src/content/llms-full.ts";

test("seed = code FAQ, with the inline edits saved since PR #26 carried over", () => {
  for (const loc of ["es", "en"] as const) {
    assert.deepEqual(seedFaq(loc, undefined), homeCopy[loc].faq.items.map(({ q, a }) => ({ q, a })));
  }
  const s = seedFaq("es", { "landing.home.faq.items.1.q": "¿Editada?", "landing.home.faq.items.0.a": "Respuesta editada", "landing.home.title": "x" });
  assert.equal(s[1].q, "¿Editada?");
  assert.equal(s[0].a, "Respuesta editada");
  assert.equal(s[0].q, homeCopy.es.faq.items[0].q);
  assert.equal(s.length, homeCopy.es.faq.items.length);
});

test("validate: trims, needs question and answer, caps size", () => {
  assert.deepEqual(validateFaqItems([{ q: "  ¿Hola?\n ", a: " Sí. " }]), { ok: true, items: [{ q: "¿Hola?", a: "Sí." }] });
  assert.deepEqual(validateFaqItems([]), { ok: true, items: [] });
  assert.equal(validateFaqItems([{ q: "", a: "x" }]).ok, false);
  assert.equal(validateFaqItems([{ q: "x" }]).ok, false);
  assert.equal(validateFaqItems("nope").ok, false);
  assert.equal(validateFaqItems(Array.from({ length: FAQ_MAX_ITEMS + 1 }, () => ({ q: "q", a: "a" }))).ok, false);
});

test("stored JSON: bad or missing = null (seed is used)", () => {
  assert.equal(parseStoredFaq(null), null);
  assert.equal(parseStoredFaq("{bad"), null);
  assert.deepEqual(parseStoredFaq('[{"q":"a","a":"b"}]'), [{ q: "a", a: "b" }]);
});

test("llms-full.txt keeps its sections around the FAQ", () => {
  assert.match(LLMS_FULL_BEFORE_FAQ, /## How working with him goes/);
  assert.doesNotMatch(LLMS_FULL_BEFORE_FAQ, /## Frequently asked questions/);
  assert.match(LLMS_FULL_AFTER_FAQ, /^## Contacting him/);
  assert.equal(faqToText([{ q: "Q1", a: "A1" }, { q: "Q2", a: "A2" }]), "Q: Q1\nA: A1\n\nQ: Q2\nA: A2");
});
