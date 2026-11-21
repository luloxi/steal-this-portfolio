import { test } from "node:test";
import assert from "node:assert/strict";
import { faqLd, ldScript, localizedOgImage } from "../src/lib/seo.ts";
import { homeCopy } from "../src/content/home-copy.ts";

test("share image follows the URL language", () => {
  assert.equal(localizedOgImage("/og-automation-es.jpg", "en"), "/og-automation-en.jpg");
  assert.equal(localizedOgImage("/og-automation-es.jpg", "es"), "/og-automation-es.jpg");
  assert.equal(localizedOgImage("/og.png", "en"), "/og.png");
});

test("JSON-LD is parseable and cannot close its script tag", () => {
  const body = ldScript([faqLd([{ q: "</script><b>?", a: "ok" }])]);
  assert.ok(!body.includes("</script"));
  const parsed = JSON.parse(body);
  assert.equal(parsed["@context"], "https://schema.org");
  assert.equal(parsed["@graph"][0]["@type"], "FAQPage");
});

test("FAQ JSON-LD mirrors the visible FAQ in both languages", () => {
  for (const locale of ["es", "en"] as const) {
    const items = homeCopy[locale].faq.items;
    const ld = faqLd(items) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    assert.equal(ld.mainEntity.length, items.length);
    assert.equal(ld.mainEntity[0].acceptedAnswer.text, items[0].a);
  }
});
