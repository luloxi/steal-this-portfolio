import test from "node:test";
import assert from "node:assert/strict";
const mediaLib = await import("../src/lib/media.ts");
const { isMediaKey, sniffImage } = mediaLib;
test("media keys are strict", () => {
  assert.ok(isMediaKey("blog/2026/123e4567-e89b-12d3-a456-426614174000.png"));
  for (const k of ["../x", "blog/2026/x.svg", "blog/2026/123e4567-e89b-12d3-a456-426614174000.svg", "other/2026/123e4567-e89b-12d3-a456-426614174000.png"]) assert.ok(!isMediaKey(k), k);
});
test("magic bytes", () => {
  assert.equal(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])), "image/png");
  assert.equal(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffImage(new TextEncoder().encode("<svg xmlns=")), null);
});

test("upload gate: size and real type are checked server-side", () => {
  const { checkUpload, MEDIA_MAX } = mediaLib;
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  assert.deepEqual(checkUpload(1234, png), { ok: true, type: "image/png", ext: "png" });
  assert.deepEqual(checkUpload(10, jpg), { ok: true, type: "image/jpeg", ext: "jpg" });
  assert.deepEqual(checkUpload(null, null), { ok: false, error: "no_file", status: 400 });
  assert.deepEqual(checkUpload(0, png), { ok: false, error: "empty", status: 400 });
  assert.deepEqual(checkUpload(MEDIA_MAX + 1, png), { ok: false, error: "too_large", status: 413 });
  // A file renamed to .png that is really SVG or HTML is refused by its bytes.
  assert.deepEqual(checkUpload(100, new TextEncoder().encode("<svg xmlns=")), { ok: false, error: "unsupported_type", status: 415 });
  assert.deepEqual(checkUpload(100, new TextEncoder().encode("<!doctype html>")), { ok: false, error: "unsupported_type", status: 415 });
  assert.equal(checkUpload(MEDIA_MAX, png).ok, true); // exactly the limit is fine
});
