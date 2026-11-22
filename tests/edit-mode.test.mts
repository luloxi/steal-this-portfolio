/** Blog drafts: admin with edit mode OFF sees exactly what a visitor sees. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { canSeeDrafts, editModeCookie, editModeFromCookie } from "../src/lib/edit-mode.ts";

test("edit mode cookie: default ON, only explicit off turns it off", () => {
  assert.equal(editModeFromCookie(null), true);
  assert.equal(editModeFromCookie(""), true);
  assert.equal(editModeFromCookie("lulox-edit-mode=on"), true);
  assert.equal(editModeFromCookie("a=1; lulox-edit-mode=off; b=2"), false);
  assert.equal(editModeFromCookie("x-lulox-edit-mode=off"), true);
});

test("drafts only for admin with edit ON (listing and slug use the same gate)", () => {
  assert.equal(canSeeDrafts(true, "lulox-edit-mode=on"), true);
  assert.equal(canSeeDrafts(true, ""), true);
  assert.equal(canSeeDrafts(true, "lulox-edit-mode=off"), false);
  assert.equal(canSeeDrafts(false, "lulox-edit-mode=on"), false);
  assert.equal(canSeeDrafts(false, "lulox-edit-mode=off"), false);
});

test("cookie written by the toggle round-trips", () => {
  for (const on of [true, false]) {
    const c = editModeCookie(on);
    assert.match(c, /Path=\//);
    assert.equal(editModeFromCookie(c.split(";")[0]), on);
  }
});

test("/en/blog draft lookup: only the admin with edit mode ON (no leak to signed-in non-admins)", async () => {
  const { mayLookUpDrafts } = await import("../src/lib/edit-mode.ts");
  let calls = 0;
  const admin = (v: boolean) => async () => { calls++; return v; };
  // Visitor (no session cookie): never asks the allowlist, no drafts.
  assert.equal(await mayLookUpDrafts(false, "", admin(true)), false);
  // Signed-in user who isn't on the allowlist: no drafts.
  assert.equal(await mayLookUpDrafts(true, "lulox-edit-mode=on", admin(false)), false);
  // Admin with edit mode OFF: like a visitor, allowlist not even checked.
  const before = calls;
  assert.equal(await mayLookUpDrafts(true, "lulox-edit-mode=off", admin(true)), false);
  assert.equal(calls, before);
  // Admin with edit mode ON (default when the cookie is missing).
  assert.equal(await mayLookUpDrafts(true, "lulox-edit-mode=on", admin(true)), true);
  assert.equal(await mayLookUpDrafts(true, null, admin(true)), true);
});

test("owner on an article with edit mode OFF gets the 'Activar modo editor' prompt; nobody else does", async () => {
  const { shouldOfferEditMode } = await import("../src/lib/edit-mode.ts");
  assert.equal(shouldOfferEditMode(true, false), true); // owner, edit off: offer it
  assert.equal(shouldOfferEditMode(true, true), false); // already editing
  assert.equal(shouldOfferEditMode(false, false), false); // visitor or signed-in non-owner
  assert.equal(shouldOfferEditMode(false, true), false);
});
