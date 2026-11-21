import { test } from "node:test";
import assert from "node:assert/strict";
import { charCount, clampMessage, MAX_MESSAGE } from "../src/lib/hire-limits.ts";

test("limit is 1000 characters", () => {
  assert.equal(MAX_MESSAGE, 1000);
});

test("counts by code point: an emoji is 1 character", () => {
  assert.equal(charCount("😀"), 1);
  assert.equal("😀".length, 2); // what native maxLength would count
  assert.equal(charCount("a😀b"), 3);
});

test("clampMessage: under the limit passes through", () => {
  assert.equal(clampMessage("hola"), "hola");
});

test("clampMessage: over the limit trims by code point, never splitting an emoji", () => {
  const r = clampMessage("😀".repeat(MAX_MESSAGE + 50));
  assert.equal(charCount(r), MAX_MESSAGE);
  assert.equal(r, "😀".repeat(MAX_MESSAGE));
});
