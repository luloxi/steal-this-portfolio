/** Sobre mí publications: validation, defaults fallback, D1 (no DELETE), permissions, layout order, copy tolerance and the manual copy SQL. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  citationParts,
  cleanHttpsUrl,
  DEFAULT_PUBLICATIONS,
  movePublication,
  newPublicationId,
  publicationsFor,
  publicationsFromRows,
  publicationTitle,
  stripPublicationLinks,
  stripPublicationLinksInBody,
  validatePublicationsPayload,
  type Publication,
} from "../src/lib/publications.ts";
import { handlePublicationsSave, publicationsGate } from "../src/lib/publications-api.ts";
import { loadPublications, savePublications } from "../src/lib/publications-db.ts";
import { parseLayout, recordsAfterStory, serializeLayout, insertJob, insertStory } from "../src/lib/page-layout.ts";
import { splitSections } from "../src/lib/md-sections.ts";
import { messages } from "../src/i18n/messages.ts";
import { d1 } from "./d1-sqlite.mts";

const fx = (n: string) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), "utf8");
const LIVE = { es: fx("about-body-live-es.md"), en: fx("about-body-live-en.md") };
const URLS = [
  "https://www.linkedin.com/feed/update/urn:li:activity:7501713293321854976/",
  "https://drive.google.com/file/d/1Malx_E4Z1flmVr5hQgCRejJEWL8HxjiQ/view?usp=drive_link",
];
const MIG = ["0011_publications.sql"];
const sample = (): Publication => ({
  id: "paper-a",
  title: "A paper",
  title_en: "",
  note_es: "Nota",
  note_en: "Note",
  authors: "Ada Lovelace",
  year: 2026,
  venue: "PDF",
  url: "https://example.com/paper",
  hidden: false,
});
const base = (): Publication[] => [sample(), { ...sample(), id: "paper-b", title: "Another", authors: "Grace Hopper", year: null, venue: "Blog", url: "https://example.com/other" }];
const pub = (patch: Partial<Publication> = {}): Publication => ({ ...sample(), id: "x-1", ...patch });

test("defaults: a fresh database has no publications", () => {
  assert.deepEqual(DEFAULT_PUBLICATIONS, []);
  assert.equal(validatePublicationsPayload({ items: base() }).ok, true);
  assert.deepEqual(citationParts(base()[1]), ["Grace Hopper", "Blog"]);
  assert.equal(publicationTitle(pub({ title: "Original", title_en: "English" }), "en"), "English");
  assert.equal(publicationTitle(pub({ title: "Original", title_en: "English" }), "es"), "Original");
});

test("validation: strict shape, https only, lengths, year, ids", () => {
  const ok = (items: unknown[]) => validatePublicationsPayload({ items });
  const err = (p: Record<string, unknown>) => ok([{ ...pub(), ...p }]);
  assert.equal(ok([]).ok, true);
  assert.deepEqual(err({ url: "http://example.com/a" }), { ok: false, error: "invalid_url", index: 0, field: "url" });
  for (const url of ["javascript:alert(1)", "data:text/html,x", "//x.com/a", "https://", "https://user:pw@x.com/", "https://x.com/a b", "ftp://x.com", 42, "https://x.com/" + "a".repeat(600)])
    assert.equal(err({ url }).ok, false, String(url));
  assert.equal(cleanHttpsUrl("  https://x.com/a  "), "https://x.com/a");
  assert.deepEqual(err({ title: "   " }), { ok: false, error: "required", index: 0, field: "title" });
  assert.deepEqual(err({ title: "a".repeat(301) }), { ok: false, error: "invalid_value", index: 0, field: "title" });
  assert.deepEqual(err({ note_es: "a".repeat(161) }), { ok: false, error: "invalid_value", index: 0, field: "note_es" });
  assert.deepEqual(err({ authors: 5 }), { ok: false, error: "invalid_value", index: 0, field: "authors" });
  assert.deepEqual(err({ year: 2026.5 }), { ok: false, error: "invalid_value", index: 0, field: "year" });
  assert.deepEqual(err({ year: "2026" }), { ok: false, error: "invalid_value", index: 0, field: "year" });
  assert.deepEqual(err({ year: 1800 }), { ok: false, error: "invalid_value", index: 0, field: "year" });
  assert.equal(err({ year: null }).ok, true);
  assert.deepEqual(err({ hidden: 1 }), { ok: false, error: "invalid_value", index: 0, field: "hidden" });
  assert.deepEqual(err({ id: "Bad Id" }), { ok: false, error: "invalid_value", index: 0, field: "id" });
  assert.deepEqual(err({ extra: "x" }), { ok: false, error: "unknown_field", index: 0, field: "extra" });
  assert.deepEqual(ok([pub(), pub()]), { ok: false, error: "duplicate_id", index: 1, field: "id" });
  assert.deepEqual(ok(Array.from({ length: 31 }, (_, i) => pub({ id: `p-${i}` }))), { ok: false, error: "too_many" });
  for (const b of [null, "x", [], {}, { items: {} }]) assert.equal(validatePublicationsPayload(b).ok, false);
  // Whitespace is collapsed and trimmed.
  const v = err({ title: "  A \n  B  " });
  assert.ok(v.ok && v.items[0].title === "A B");
  const { title: _t, ...missing } = pub(); // eslint-disable-line @typescript-eslint/no-unused-vars
  assert.deepEqual(ok([missing]), { ok: false, error: "invalid_value", index: 0, field: "title" });
});

test("fallback: no rows, no table or no binding = empty list; bad rows are skipped", async () => {
  assert.deepEqual(publicationsFromRows([]), []);
  assert.deepEqual(publicationsFromRows(null), []);
  assert.deepEqual(await loadPublications(null), []);
  assert.deepEqual(await loadPublications(d1([])), []); // table missing (migration not applied yet)
  assert.deepEqual(await loadPublications(d1(MIG)), []); // table empty
  const rows = publicationsFromRows([
    { id: "ok", title: "T", title_en: "", note_es: "", note_en: "", authors: "", year: null, venue: "", url: "https://x.com/", hidden: 0 },
    { id: "bad", title: "T", title_en: "", note_es: "", note_en: "", authors: "", year: null, venue: "", url: "http://x.com/", hidden: 0 },
    { id: "ok", title: "dup", title_en: "", note_es: "", note_en: "", authors: "", year: null, venue: "", url: "https://y.com/", hidden: 1 },
  ]);
  assert.deepEqual(rows.map((r) => r.id), ["ok"]);
});

test("D1: save is upsert in list order, remove = hidden (no DELETE), restore, rows missing from a save get hidden", async () => {
  const db = d1(MIG);
  const deletes: string[] = [];
  const spy = { ...db, prepare: (sql: string) => { if (/\bdelete\b/i.test(sql)) deletes.push(sql); return db.prepare(sql); } };
  const added = pub({ id: "new-one", title: "New", url: "https://example.com/new", year: 2025, venue: "Blog" });
  await savePublications(spy, [base()[1], added, base()[0]]);
  let got = await loadPublications(db);
  assert.deepEqual(got.map((p) => p.id), ["paper-b", "new-one", "paper-a"]);
  // Remove (hide) and edit.
  await savePublications(spy, got.map((p) => (p.id === "new-one" ? { ...p, hidden: true, title: "Edited" } : p)));
  got = await loadPublications(db);
  assert.deepEqual(got.find((p) => p.id === "new-one"), { ...added, hidden: true, title: "Edited" });
  assert.deepEqual(publicationsFor(got, false).map((p) => p.id), ["paper-b", "paper-a"]);
  assert.equal(publicationsFor(got, true).length, 3);
  // Restore.
  await savePublications(spy, got.map((p) => ({ ...p, hidden: false })));
  assert.equal(publicationsFor(await loadPublications(db), false).length, 3);
  // A save that omits a stored row hides it instead of deleting it.
  await savePublications(spy, [base()[0]]);
  const n = db.raw.prepare("SELECT count(*) AS n, sum(hidden) AS h FROM publications").get() as { n: number; h: number };
  assert.deepEqual({ n: n.n, h: n.h }, { n: 3, h: 2 });
  assert.deepEqual(publicationsFor(await loadPublications(db), false).map((p) => p.id), ["paper-a"]);
  assert.deepEqual(deletes, []);
  const src = readFileSync(new URL("../src/lib/publications-db.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""), /\bDELETE\b/i);
});

test("migration 0011 is additive and its CHECKs back the app limits", () => {
  const sql = readFileSync(new URL("../migrations/0011_publications.sql", import.meta.url), "utf8").replace(/--.*$/gm, "");
  assert.doesNotMatch(sql, /\b(DROP|DELETE|ALTER|RENAME)\b/i);
  const db = d1(MIG);
  assert.throws(() => db.raw.prepare("INSERT INTO publications (id, title, url) VALUES ('a', 'T', 'http://x.com')").run());
  assert.throws(() => db.raw.prepare("INSERT INTO publications (id, title, url, hidden) VALUES ('a', 'T', 'https://x.com', 2)").run());
  db.raw.prepare("INSERT INTO publications (id, title, url) VALUES ('a', 'T', 'https://x.com')").run();
});

test("permissions: anon 401, non-admin 403, admin with edit mode off 403, nothing saved", async () => {
  let calls = 0;
  const save = async () => { calls++; };
  const body = { items: base() };
  assert.equal((await handlePublicationsSave({ signedIn: false, isAdmin: false, editOn: true }, body, save)).status, 401);
  assert.equal((await handlePublicationsSave({ signedIn: true, isAdmin: false, editOn: true }, body, save)).status, 403);
  const off = await handlePublicationsSave({ signedIn: true, isAdmin: true, editOn: false }, body, save);
  assert.deepEqual(off, { status: 403, body: { error: "edit_mode_off" } });
  assert.equal(calls, 0);
  const bad = await handlePublicationsSave({ signedIn: true, isAdmin: true, editOn: true }, { items: [pub({ url: "http://x" })] }, save);
  assert.deepEqual(bad, { status: 400, body: { error: "invalid_url", index: 0, field: "url" } });
  assert.equal(calls, 0);
  const ok = await handlePublicationsSave({ signedIn: true, isAdmin: true, editOn: true }, body, save);
  assert.equal(ok.status, 200);
  assert.equal(calls, 1);
  assert.equal(publicationsGate({ signedIn: true, isAdmin: true, editOn: true }), null);
  const boom = await handlePublicationsSave({ signedIn: true, isAdmin: true, editOn: true }, body, async () => { throw new Error("x"); });
  assert.equal(boom.status, 500);
});

test("rendering order: the Publications block sits right below 'Agentes e investigación' / 'Agents and research'", () => {
  for (const loc of ["es", "en"] as const) {
    const sections = splitSections(LIVE[loc]).sections.map((s) => s.title);
    const layout = parseLayout(messages[loc].about.layout, sections.length, messages[loc].about.timeline.length, 1);
    const flat = serializeLayout(layout).split(",");
    const at = flat.indexOf("pubs:0");
    assert.ok(at > 0);
    assert.equal(sections[Number(flat[at - 1].split(":")[1])], loc === "es" ? "AGENTES E INVESTIGACIÓN" : "AGENTS AND RESEARCH");
    assert.equal(flat[at + 1], "story:5");
    assert.deepEqual(recordsAfterStory(layout).get(4), [{ kind: "pubs", index: 0 }]);
  }
  // Layouts saved before this feature (no pubs token): after the last story, before unplaced jobs.
  assert.equal(serializeLayout(parseLayout("story:0,story:1", 2, 1, 1)), "story:0,story:1,pubs:0,job:0");
  // Adding a job or story after story 4 keeps the block right below it.
  const l = parseLayout(messages.es.about.layout, 6, 3, 1);
  assert.match(serializeLayout(insertJob(l, 4, 3)), /story:4,pubs:0,job:3,story:5/);
  assert.match(serializeLayout(insertStory(l, 4)), /story:4,pubs:0,story:5,story:6/);
  // Without the pubs count (old callers) the token is ignored.
  assert.doesNotMatch(serializeLayout(parseLayout(messages.es.about.layout, 6, 3)), /pubs/);
});

test("old copy tolerance: the trailing link list to these publications is dropped, nothing else", () => {
  for (const loc of ["es", "en"] as const) {
    const out = stripPublicationLinksInBody(LIVE[loc], URLS);
    assert.ok(!out.includes("7501713293321854976"));
    assert.ok(!out.includes("1Malx_E4Z1flmVr5hQgCRejJEWL8HxjiQ"));
    assert.deepEqual(splitSections(out).sections.map((s) => s.title), splitSections(LIVE[loc]).sections.map((s) => s.title));
    assert.equal(LIVE[loc].length - out.length < 400, true);
    assert.ok(out.includes(loc === "es" ? "papers analizando:\n\n## ACTUALIDAD" : "papers analyzing:\n\n## TODAY"));
  }
  // Other links and lists stay.
  const md = "texto\n\n- [otro](https://x.com/)\n- [El panorama](" + URLS[0] + ")";
  assert.equal(stripPublicationLinks(md, URLS), md);
  assert.equal(stripPublicationLinks("a\n- [x](" + URLS[0] + ")", URLS), "a\n- [x](" + URLS[0] + ")"); // not a separate list
  assert.equal(stripPublicationLinks("a\n\n- [x](" + URLS[0] + ")\n\n", URLS), "a\n\n");
  assert.equal(stripPublicationLinksInBody("sin secciones", URLS), "sin secciones");
});

test("manual copy SQL: changes only the matching text, both locales, idempotent", () => {
  const sql = readFileSync(new URL("../scripts/sql/about-publications-copy.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql.replace(/--.*$/gm, ""), /\b(DELETE|DROP|INSERT|ALTER)\b/i);
  const db = d1(["0001_init.sql", "0005_site_copy.sql"]);
  const put = db.raw.prepare("INSERT OR REPLACE INTO site_copy (key, locale, value) VALUES (?, ?, ?)");
  put.run("about.body", "es", LIVE.es);
  put.run("about.body", "en", LIVE.en);
  put.run("about.headline", "es", "papers analizando: no se toca");
  db.raw.exec(sql);
  const get = (k: string, l: string) => (db.raw.prepare("SELECT value FROM site_copy WHERE key = ? AND locale = ?").get(k, l) as { value: string }).value;
  const es = get("about.body", "es");
  const en = get("about.body", "en");
  assert.ok(es.includes("y docentes de habla inglesa\\\npapers sobre tokenización y comercio agéntico.\n\n## ACTUALIDAD"));
  assert.ok(en.includes("and English-speaking professors,\\\npapers on tokenization and agentic commerce.\n\n## TODAY"));
  for (const v of [es, en]) assert.ok(!v.includes("7501713293321854976") && !v.includes("1Malx_E4Z1"));
  // Everything else is byte-identical.
  assert.equal(LIVE.es.split("## AGENTES")[0], es.split("## AGENTES")[0]);
  assert.equal(LIVE.en.split("## TODAY")[1], en.split("## TODAY")[1]);
  assert.equal(get("about.headline", "es"), "papers analizando: no se toca");
  // Second run: no-op.
  db.raw.exec(sql);
  assert.equal(get("about.body", "es"), es);
  assert.equal(get("about.body", "en"), en);
  // A body that was edited by hand is left alone.
  db.raw.prepare("UPDATE site_copy SET value = 'editado' WHERE key = 'about.body' AND locale = 'es'").run();
  db.raw.exec(sql);
  assert.equal(get("about.body", "es"), "editado");
});

test("editor helpers: move and new ids", () => {
  assert.deepEqual(movePublication(["a", "b", "c"], 0, 1), ["b", "a", "c"]);
  assert.deepEqual(movePublication(["a", "b", "c"], 0, -1), ["a", "b", "c"]);
  assert.deepEqual(movePublication(["a", "b", "c"], 2, -1), ["a", "c", "b"]);
  const id = newPublicationId(["pub-1"], 1);
  assert.match(id, /^pub-[a-z0-9]+$/);
  assert.notEqual(id, "pub-1");
  assert.equal(validatePublicationsPayload({ items: [pub({ id })] }).ok, true);
});
