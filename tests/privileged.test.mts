import assert from "node:assert/strict";
import test from "node:test";
import { formatPrivileged, isPrivileged, parsePrivileged } from "../src/lib/privileged.ts";
import { isApiPath } from "../src/lib/rate-limit.ts";

test("parsePrivileged keeps valid unique lowercase emails", () => {
  assert.deepEqual(parsePrivileged("A@x.com, b@y.org\nA@X.com; nope; c@@d.com"), ["a@x.com", "b@y.org"]);
  assert.equal(formatPrivileged(["a@x.com", "b@y.org"]), "a@x.com\nb@y.org");
});

test("parsePrivileged caps the list at 50", () => {
  const many = Array.from({ length: 80 }, (_, i) => `u${i}@x.com`).join("\n");
  assert.equal(parsePrivileged(many).length, 50);
});

test("isPrivileged matches case-insensitively and rejects empties", () => {
  assert.equal(isPrivileged("Amigo@X.com", "amigo@x.com\nother@y.com"), true);
  assert.equal(isPrivileged("nadie@x.com", "amigo@x.com"), false);
  assert.equal(isPrivileged(null, "amigo@x.com"), false);
  assert.equal(isPrivileged("a@x.com", null), false);
});

test("isApiPath", () => {
  assert.equal(isApiPath("/api/auth/get-session"), true);
  assert.equal(isApiPath("/api"), true);
  assert.equal(isApiPath("/apiary"), false);
  assert.equal(isApiPath("/proyectos"), false);
});
