import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILT_ART, CASE_HUMAN_STEP, homeCopy, withExtraFaq } from "../src/content/home-copy.ts";
import { flattenCopy } from "../src/i18n/copy-overrides.ts";

test("landing copy has the same shape in both languages", () => {
  const es = homeCopy.es;
  const en = homeCopy.en;
  assert.equal(es.faq.items.length, 7);
  assert.equal(es.faq.extra.length, 2);
  assert.equal(es.featured.items.length, 4);
  assert.equal(es.built.items.length, 6);
  assert.equal(BUILT_ART.length, es.built.items.length);
  assert.deepEqual(Object.keys(flattenCopy(es)).sort(), Object.keys(flattenCopy(en)).sort());
  es.featured.items.forEach((it, i) => {
    assert.equal(en.featured.items[i].flow.length, it.flow.length);
    assert.ok(CASE_HUMAN_STEP[i] < it.flow.length);
  });
  for (const loc of ["es", "en"] as const) assert.match(homeCopy[loc].featured.hireMessage, /\{receta\}/);
});

test("landing and services copy: two paths, benefits first, no stack names, never cheap", async () => {
  const { servicesCopy } = await import("../src/content/services-copy.ts");
  assert.equal(homeCopy.es.hero.title, "Lo repetitivo se hace solo. Vos, a lo que te importa.");
  for (const loc of ["es", "en"] as const) {
    const text = [flattenCopy(homeCopy[loc]), flattenCopy(servicesCopy[loc])].flatMap((m) => Object.values(m)).join(" ");
    assert.doesNotMatch(text, /freelanc|independientes|n8n|Next\.js|Cloudflare|Grok|Hermes/i);
    assert.doesNotMatch(text, /barat|económic|economic|cheap|low[- ]cost|affordable|\u2014/i);
    assert.doesNotMatch(text, /\b(armo|construí|me dedico)\b/i);
  }
  for (const m of [flattenCopy(homeCopy.en), flattenCopy(servicesCopy.en)]) assert.doesNotMatch(Object.values(m).join(" "), /\bIA\b/);
});

test("saved FAQ keeps its order and gets the new questions it lacks, once", () => {
  const extra = homeCopy.es.faq.extra;
  const saved = [{ q: "Uno", a: "1" }, { ...extra[1] }];
  const out = withExtraFaq(saved, extra);
  assert.deepEqual(out.map((x) => x.q), [extra[0].q, "Uno", extra[1].q]);
});

test("recipes: one per home case, both languages, only Grok, Grok Bot and Hermes", async () => {
  const { RECIPES, recipesCopy, recipesToText } = await import("../src/content/recipes.ts");
  assert.equal(RECIPES.length, homeCopy.es.featured.items.length);
  for (const r of RECIPES) {
    for (const loc of ["es", "en"] as const) {
      const x = r.copy[loc];
      assert.ok(x.title && x.result && x.needs && x.prompt);
      assert.ok(x.steps.length >= 1 && x.steps.length <= 3);
      const text = [x.title, x.result, x.needs, x.prompt, ...x.steps].join(" ");
      assert.doesNotMatch(text, /zapier|n8n|make\.com|fireflies|otter|feedly|chatgpt|\u2014/i);
    }
    assert.doesNotMatch(Object.values(r.copy.en).flat().join(" "), /\bIA\b/);
  }
  assert.doesNotMatch(Object.values(recipesCopy.en).join(" "), /\bIA\b/);
  // Prompts drive themselves: no blanks to fill by hand; they ask, check the tool and point to contact.
  for (const r of RECIPES) {
    for (const loc of ["es", "en"] as const) {
      const pr = r.copy[loc].prompt;
      assert.doesNotMatch(pr, /\[[^\]]*\]/, `${r.slug} ${loc} has a [blank]`);
      assert.match(pr, /Grok, Grok Bot (o|or) Hermes/);
      assert.match(pr, /MCP/);
      assert.match(pr, loc === "es" ? /lulox\.com\.ar\/contacto/ : /lulox\.com\.ar\/en\/contact/);
      assert.match(pr, loc === "es" ? /preguntas/ : /questions/);
    }
  }
  assert.match(recipesToText(), /https:\/\/lulox\.com\.ar\/en\/recipes/);
});
