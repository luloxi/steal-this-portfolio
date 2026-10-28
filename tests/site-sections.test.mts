/** Admin strip: order + visibility of sections and projects (merge, validation, 404 gating, sitemap, SQL). */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  SECTION_KEYS,
  defaultOrder,
  hiddenSet,
  isPathHidden,
  matchesQuery,
  mergeOrder,
  mergeProjects,
  mergeSections,
  moveItem,
  orderRecords,
  projectForPath,
  sectionForPath,
  validateOrderPayload,
  visibleItems,
} from "../src/lib/site-sections.ts";
import { enToEsPath, pathPair } from "../src/lib/routes.ts";
import { sections } from "../src/content/site.ts";

test("section keys come from the code, in the current order", () => {
  assert.deepEqual(SECTION_KEYS, sections.map((s) => s.id));
  assert.deepEqual(SECTION_KEYS, ["hire", "blog", "about", "projects", "contact", "referrals"]);
  assert.ok(!(SECTION_KEYS as readonly string[]).includes("home"), "home is not hideable");
});

test("no rows (or missing table) = sections visible in code order, and no projects", () => {
  assert.deepEqual(mergeSections([]), defaultOrder(SECTION_KEYS));
  assert.deepEqual(mergeSections(null), defaultOrder(SECTION_KEYS));
  assert.deepEqual(mergeProjects(undefined), []);
  assert.deepEqual(mergeProjects([]), []);
});

test("merge: sort by position, drop unknown/duplicates, append missing visible", () => {
  const out = mergeSections([
    { key: "contact", position: 0, visible: 1 },
    { key: "blog", position: 1, visible: 0 },
    { key: "home", position: 2, visible: 0 },
    { key: "nope", position: -5, visible: 1 },
    { key: "blog", position: 9, visible: 1 },
    { key: "about", position: 3, visible: false },
  ]);
  assert.deepEqual(out, [
    { key: "contact", visible: true },
    { key: "blog", visible: false },
    { key: "about", visible: false },
    { key: "hire", visible: true },
    { key: "projects", visible: true },
    { key: "referrals", visible: true }, // added after 0008 rows were saved: appended, visible
  ]);
  // Position ties keep the code order.
  assert.deepEqual(
    mergeOrder(["a", "b", "c"], [{ key: "c", position: 0, visible: 1 }, { key: "a", position: 0, visible: 1 }]).map((x) => x.key),
    ["a", "c", "b"],
  );
});

test("validation: full permutation with boolean visible only", () => {
  const items = SECTION_KEYS.map((key, i) => ({ key, visible: i !== 1 }));
  const ok = validateOrderPayload({ kind: "sections", items: [...items].reverse() });
  assert.ok(ok.ok);
  if (ok.ok) assert.deepEqual(ok.items, [...items].reverse());
  assert.equal(validateOrderPayload(null).ok, false);
  assert.deepEqual(validateOrderPayload({ kind: "pages", items }), { ok: false, error: "unknown_kind" });
  assert.deepEqual(validateOrderPayload({ kind: "sections" }), { ok: false, error: "items_required" });
  assert.deepEqual(validateOrderPayload({ kind: "sections", items: items.slice(1) }), { ok: false, error: "wrong_length" });
  assert.deepEqual(
    validateOrderPayload({ kind: "sections", items: [{ key: "home", visible: false }, ...items.slice(1)] }),
    { ok: false, error: "unknown_key" },
  );
  assert.deepEqual(
    validateOrderPayload({ kind: "sections", items: [items[0], items[0], ...items.slice(2)] }),
    { ok: false, error: "duplicate_key" },
  );
  assert.deepEqual(
    validateOrderPayload({ kind: "sections", items: [{ key: "hire", visible: "no" }, ...items.slice(1)] }),
    { ok: false, error: "invalid_visible" },
  );
  // Projects are a dynamic set: the route passes the ids that exist in D1.
  const ids = ["alpha", "beta"];
  assert.deepEqual(validateOrderPayload({ kind: "projects", items }, ids), { ok: false, error: "wrong_length" });
  const p = ids.map((key) => ({ key, visible: true }));
  assert.ok(validateOrderPayload({ kind: "projects", items: p }, ids).ok);
  assert.deepEqual(
    validateOrderPayload({ kind: "projects", items: [{ key: "nope", visible: true }, p[1]] }, ids),
    { ok: false, error: "unknown_key" },
  );
  assert.equal(validateOrderPayload({ kind: "projects", items: [{ key: "Bad", visible: true }] }).ok, false);
});

test("moveItem and visibleItems", () => {
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 0, 2), ["b", "c", "a", "d"]);
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 3, 0), ["d", "a", "b", "c"]);
  assert.deepEqual(moveItem(["a", "b"], 0, 5), ["a", "b"]);
  const list = mergeSections([{ key: "blog", position: 1, visible: 0 }]);
  assert.ok(!visibleItems(list, false).some((s) => s.key === "blog"));
  assert.ok(visibleItems(list, true).some((s) => s.key === "blog"), "admin in edit mode still sees it");
});

test("orderRecords: order, hide, admin sees hidden", () => {
  const recs = ["alpha", "beta", "gamma"].map((id) => ({ id }));
  const order = mergeProjects([
    { key: "gamma", position: 0, visible: 1 },
    { key: "beta", position: 1, visible: 0 },
    { key: "alpha", position: 2, visible: 1 },
  ]);
  assert.deepEqual(orderRecords(recs, order).map((r) => r.id), ["gamma", "alpha"]);
  assert.deepEqual(orderRecords(recs, order, true).map((r) => r.id), ["gamma", "beta", "alpha"]);
  // A record the order does not know stays at the end.
  assert.deepEqual(orderRecords([...recs, { id: "extra" }], order, true).map((r) => r.id), ["gamma", "beta", "alpha", "extra"]);
});

test("path -> section / project, subpages included", () => {
  assert.equal(sectionForPath("/"), null);
  assert.equal(sectionForPath("/privacidad"), null);
  assert.equal(sectionForPath("/ingresar"), null);
  assert.equal(sectionForPath("/contratar"), "hire");
  assert.equal(sectionForPath("/blog/un-articulo?x=1"), "blog");
  assert.equal(sectionForPath("/sobre-mi"), "about");
  assert.equal(sectionForPath("/tastes"), "about");
  assert.equal(sectionForPath("/proyectos/alpha"), "projects");
  assert.equal(sectionForPath("/contacto/"), "contact");
  assert.equal(projectForPath("/proyectos/alpha"), "alpha");
  assert.equal(projectForPath("/proyectos"), null);
});

const HIDE = (keys: string[]) => mergeSections(keys.map((key, i) => ({ key, position: i, visible: 0 })));

test("404 gating: hidden section pages in es and /en (proxy maps /en first)", () => {
  const blogOff = HIDE(["blog"]);
  for (const p of ["/blog", "/blog/por-que-deje-hermes-agent", "/en/blog", "/en/blog/why-i-left-hermes-agent"]) {
    const es = p.startsWith("/en") ? enToEsPath(p) : p;
    assert.ok(es && isPathHidden(es, blogOff), p);
  }
  for (const p of ["/", "/en", "/contratar", "/en/hire", "/privacidad", "/en/privacy", "/proyectos/alpha"]) {
    const es = p.startsWith("/en") ? enToEsPath(p) : p;
    assert.ok(es && !isPathHidden(es, blogOff), p);
  }
  // Every hideable section, both languages.
  for (const s of sections) {
    const off = HIDE([s.id]);
    const { es, en } = pathPair(s.href);
    assert.ok(isPathHidden(es, off), es);
    assert.ok(isPathHidden(enToEsPath(en)!, off), en);
  }
  // Nothing hidden = nothing gated.
  for (const s of sections) assert.ok(!isPathHidden(s.href, mergeSections([])));
});

test("404 gating: hidden project only (es + en), the list stays", () => {
  const sec = mergeSections([]);
  const proj = mergeProjects([{ key: "alpha", position: 0, visible: 0 }]);
  assert.ok(isPathHidden("/proyectos/alpha", sec, proj));
  assert.ok(isPathHidden(enToEsPath("/en/projects/alpha")!, sec, proj));
  assert.ok(!isPathHidden("/proyectos/beta", sec, proj));
  assert.ok(!isPathHidden("/proyectos", sec, proj));
  // Whole projects section hidden: every project page too.
  assert.ok(isPathHidden("/proyectos/beta", HIDE(["projects"]), mergeProjects([])));
});

test("sitemap filter: hidden sections and projects leave both languages", () => {
  const order = { sections: HIDE(["contact"]), projects: mergeProjects([{ key: "alpha", position: 0, visible: 0 }]) };
  const shown = (p: string) => !isPathHidden(p, order.sections, order.projects);
  const pages = ["/", "/sobre-mi", "/proyectos", "/blog", "/contacto", "/contratar", "/privacidad"].filter(shown);
  assert.deepEqual(pages, ["/", "/sobre-mi", "/proyectos", "/blog", "/contratar", "/privacidad"]);
  const urls = pages.flatMap((p) => Object.values(pathPair(p)));
  assert.ok(!urls.includes("/contacto") && !urls.includes("/en/contact"));
  const projects = ["alpha", "beta"].filter((id) => shown(`/proyectos/${id}`));
  assert.deepEqual(projects, ["beta"]);
});

test("referrals is a section: hiding it 404s /referidos and /en/referrals and drops it from the sitemap", () => {
  assert.equal(sectionForPath("/referidos"), "referrals");
  assert.equal(sectionForPath(enToEsPath("/en/referrals")!), "referrals");
  const sec = HIDE(["referrals"]);
  assert.ok(isPathHidden("/referidos", sec));
  assert.ok(isPathHidden(enToEsPath("/en/referrals")!, sec));
  assert.ok(!isPathHidden("/contratar", sec), "attribution on /contratar keeps working");
  const pages = ["/", "/contratar", "/referidos", "/privacidad"].filter((p) => !isPathHidden(p, sec));
  assert.deepEqual(pages, ["/", "/contratar", "/privacidad"]);
});

test("search: case and accent insensitive", () => {
  assert.ok(matchesQuery("Sobre mí", "MI"));
  assert.ok(matchesQuery("Proyectos", "  yec "));
  assert.ok(matchesQuery("Blog", ""));
  assert.ok(!matchesQuery("Contacto", "blog"));
});

test("migration 0008 is additive and the upsert never deletes", () => {
  const sql = readFileSync(new URL("../migrations/0008_site_sections.sql", import.meta.url), "utf8");
  assert.ok(!/\b(DROP|DELETE|RENAME|ALTER)\b/i.test(sql.replace(/--.*$/gm, "")), "only CREATE TABLE IF NOT EXISTS");
  const db = new DatabaseSync(":memory:");
  db.exec(sql);
  db.exec(sql); // idempotent
  const upsert = db.prepare(
    `INSERT INTO site_sections (key, position, visible, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (key) DO UPDATE SET position = excluded.position, visible = excluded.visible, updated_at = excluded.updated_at`,
  );
  SECTION_KEYS.forEach((k, i) => upsert.run(k, i, k === "blog" ? 0 : 1, "t1"));
  [...SECTION_KEYS].reverse().forEach((k, i) => upsert.run(k, i, 1, "t2"));
  const rows = db.prepare("SELECT key, position, visible FROM site_sections").all() as { key: string; position: number; visible: number }[];
  assert.equal(rows.length, SECTION_KEYS.length);
  assert.deepEqual(mergeSections(rows), [...SECTION_KEYS].reverse().map((key) => ({ key, visible: true })));
  assert.throws(() => db.prepare("INSERT INTO site_sections (key, position, visible) VALUES ('x', 0, 2)").run());
  db.prepare("INSERT INTO project_settings (id, position, visible) VALUES ('alpha', 0, 0)").run();
  const p = db.prepare("SELECT id AS key, position, visible FROM project_settings").all() as { key: string; position: number; visible: number }[];
  assert.equal(hiddenSet(mergeProjects(p)).has("alpha"), true);
});
