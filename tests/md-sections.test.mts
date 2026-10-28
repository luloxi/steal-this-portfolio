/** Per-section editing of the Sobre mí body must leave the rest byte-identical. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { deleteSection, joinSections, replaceIntro, splitSections, upsertSection } from "../src/lib/md-sections.ts";

const md = [
  "Buenas, soy Ana *. ",
  "",
  "## PRIMEROS PASOS",
  "",
  "Uno.  ",
  "",
  "Dos con **negrita**.",
  "",
  "## SEGUNDA",
  "",
  "Texto.",
  "Línea.",
  "",
  "## ÚLTIMA",
  "",
  "Fin.",
  "",
  "* Respecto al sitio: nota.",
].join("\n");

test("split/join round-trips exactly", () => {
  assert.equal(joinSections(splitSections(md)), md);
  assert.equal(splitSections(md).sections.length, 3);
});

test("editing one section keeps every other byte", () => {
  const out = upsertSection(md, 1, "SEGUNDA EDITADA", "Nuevo *texto*.");
  const a = splitSections(out), b = splitSections(md);
  assert.deepEqual(a.intro, b.intro);
  assert.deepEqual(a.sections[0], b.sections[0]);
  assert.deepEqual(a.sections[2], b.sections[2]);
  assert.equal(a.sections[1].heading, "## SEGUNDA EDITADA");
  assert.ok(out.includes("## SEGUNDA EDITADA\n\nNuevo *texto*.\n\n## ÚLTIMA"));
});

test("unchanged save is a no-op on structure", () => {
  const sp = splitSections(md);
  const body = sp.sections[0].lines.join("\n").replace(/^\s*\n/, "").replace(/\s+$/, "");
  assert.equal(upsertSection(md, 0, "PRIMEROS PASOS", body), md);
});

test("add, delete, intro", () => {
  const added = upsertSection(md, 99, "NUEVA", "Hola.");
  assert.ok(added.startsWith(md.trimEnd()));
  assert.ok(added.endsWith("\n\n## NUEVA\n\nHola."));
  const del = deleteSection(md, 1);
  assert.equal(splitSections(del).sections.length, 2);
  assert.ok(!del.includes("SEGUNDA"));
  assert.ok(del.includes("Dos con **negrita**.\n\n## ÚLTIMA"));
  const intro = replaceIntro(md, "Hola, soy Ana.");
  assert.match(intro, /^Hola, soy Ana\.\s*\n\n## PRIMEROS PASOS/);
});
