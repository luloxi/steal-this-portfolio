import { test } from "node:test";
import assert from "node:assert/strict";
import { withUtm } from "../src/lib/hire-href.ts";

test("keeps utm_* params on the Contratar link", () => {
  assert.equal(withUtm("/contratar", "?utm_source=x&utm_campaign=y"), "/contratar?utm_source=x&utm_campaign=y");
});

test("drops non-utm and empty params", () => {
  assert.equal(withUtm("/contratar", "?ref=a&utm_source=&gclid=1"), "/contratar");
  assert.equal(withUtm("/en/hire", "?foo=1&utm_medium=social"), "/en/hire?utm_medium=social");
});

test("no search returns the base href untouched", () => {
  assert.equal(withUtm("/contratar", ""), "/contratar");
});

test("does not override params already in the href", () => {
  assert.equal(withUtm("/contratar?utm_source=home", "?utm_source=x"), "/contratar?utm_source=home");
});
