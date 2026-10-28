import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SITE, validateSettingsPayload } from "../src/lib/site-settings.ts";

test("saving a value equal to the neutral default is accepted", () => {
  const v = validateSettingsPayload({ values: { name: DEFAULT_SITE.name, hero_photo: DEFAULT_SITE.heroPhoto, tagline: DEFAULT_SITE.tagline } });
  assert.equal(v.ok, true);
});

test("a value the cleaner rejects is still refused", () => {
  assert.deepEqual(validateSettingsPayload({ values: { url: "not a url" } }), { ok: false, error: "invalid_value", field: "url" });
  assert.deepEqual(validateSettingsPayload({ values: { hero_photo: "javascript:alert(1)" } }), { ok: false, error: "invalid_value", field: "hero_photo" });
  assert.deepEqual(validateSettingsPayload({ values: { name: "x".repeat(200) } }), { ok: false, error: "invalid_value", field: "name" });
});

test("a /media path is a valid hero photo", () => {
  assert.equal(validateSettingsPayload({ values: { hero_photo: "/media/blog/2026/abc.png" } }).ok, true);
});
