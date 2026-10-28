/** Site copy save validation and Markdown editor helpers. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { COPY_MAX_LENGTH, normalizeCopyValue } from "../src/lib/copy-value.ts";
import { continueList, prefixLines, wrapSelection } from "../src/lib/md-edit.ts";

test("long Markdown body (Sobre mí, ~5.5k chars) is accepted unchanged", () => {
  const body = "Buenas *.\n\n## PRIMEROS PASOS\n\nEn **FEDUN** y *comida barata* #1 _x_ [a](https://x.y)\n\n" + "texto ".repeat(900) + "\n\n* Respecto al sitio: nota.";
  assert.ok(body.length > 5000);
  const r = normalizeCopyValue(body);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value, body);
});

test("empty and oversized values are rejected with a reason", () => {
  assert.deepEqual(normalizeCopyValue("  \n "), { ok: false, error: "empty" });
  assert.deepEqual(normalizeCopyValue("a".repeat(COPY_MAX_LENGTH + 1)), { ok: false, error: "too_long" });
});

test("CRLF normalized, control chars dropped", () => {
  const r = normalizeCopyValue("a\r\nb\u0007");
  assert.deepEqual(r, { ok: true, value: "a\nb" });
});

test("bold/italic wrap and toggle", () => {
  assert.equal(wrapSelection("hola mundo", 5, 10, "**", "x").text, "hola **mundo**");
  assert.equal(wrapSelection("hola **mundo**", 7, 12, "**", "x").text, "hola mundo");
  assert.equal(wrapSelection("hola", 4, 4, "*", "cursiva").text, "hola*cursiva*");
});

test("heading prefix replaces other prefixes", () => {
  assert.equal(prefixLines("a\n### titulo\nb", 4, 4, () => "## ").text, "a\n## titulo\nb");
});

test("Enter continues and ends lists", () => {
  assert.equal(continueList("- uno", 5, 5)?.text, "- uno\n- ");
  assert.equal(continueList("1. uno", 6, 6)?.text, "1. uno\n2. ");
  assert.equal(continueList("- uno\n- ", 8, 8)?.text, "- uno\n");
  assert.equal(continueList("texto", 5, 5), null);
});
