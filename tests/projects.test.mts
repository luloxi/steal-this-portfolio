/** Projects are validated records. The repo has no personal project list. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { emptyProject, newProjectId, validateProject, validateProjectsPayload } from "../src/lib/projects.ts";
import { projectFromRow, saveProjects } from "../src/lib/projects-db.ts";
import { handleProjectsSave } from "../src/lib/projects-api.ts";
import { d1 } from "./d1-sqlite.mts";

const item = emptyProject("demo");
item.copy.es.title = "Demo";
item.copy.en.title = "Demo";
item.icon = "/projects/demo.svg";
item.github = "https://github.com/example/demo";
item.liveUrl = "https://example.com/demo";
item.status = "live";
item.visible = true;

test("a valid project round-trips, https and site paths only", () => {
  const v = validateProject(item);
  assert.equal(v.ok, true);
  assert.equal(validateProject({ ...item, liveUrl: "http://example.com" }).ok, false);
  assert.equal(validateProject({ ...item, icon: "javascript:alert(1)" }).ok, false);
  assert.equal(validateProject({ ...item, icon: "/projects/../secret" }).ok, false);
  assert.equal(validateProject({ ...item, id: "Bad" }).ok, false);
  assert.equal(validateProjectsPayload({ items: [item, item] }).ok, false);
  assert.equal(newProjectId(["demo"]).startsWith("p-"), true);
});

test("a stored row becomes a project, and a save never deletes", async () => {
  const db = d1(["0012_projects.sql"]);
  const row = projectFromRow({
    id: "demo",
    position: 0,
    visible: 1,
    status: "live",
    icon_url: "/icon.svg",
    github_url: "https://github.com/example/demo",
    live_url: "https://example.com",
    title_es: "Demo",
    title_en: "Demo",
    description_es: "Hola",
    description_en: "Hi",
    paragraphs_es: "[]",
    paragraphs_en: "[]",
    awards_es: "",
    awards_en: "",
    disabled_reason_es: "",
    disabled_reason_en: "",
    team_json: "[]",
    widget: "",
  });
  assert.equal(row?.copy.es.title, "Demo");
  const v = validateProject(item);
  assert.ok(v.ok);
  if (!v.ok) return;
  await saveProjects(db, [v.item]);
  await saveProjects(db, []);
  const left = db.raw.prepare("SELECT id, visible FROM projects").all() as { id: string; visible: number }[];
  assert.deepEqual(left.map((r) => ({ id: r.id, visible: Number(r.visible) })), [{ id: "demo", visible: 0 }]);
  const src = readFileSync(new URL("../src/lib/projects-db.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""), /\bDELETE\b/i);
});

test("save api: anon 401, edit mode off 403", async () => {
  let calls = 0;
  const body = { items: [item] };
  assert.equal((await handleProjectsSave({ signedIn: false, isAdmin: false, editOn: true }, body, async () => { calls++; }, async () => { calls++; })).status, 401);
  assert.equal((await handleProjectsSave({ signedIn: true, isAdmin: true, editOn: false }, body, async () => { calls++; }, async () => { calls++; })).status, 403);
  assert.equal((await handleProjectsSave({ signedIn: true, isAdmin: true, editOn: true }, body, async () => { calls++; }, async () => { calls++; })).status, 200);
  assert.equal(calls, 1);
});

test("migration 0012 is additive", () => {
  const sql = readFileSync(new URL("../migrations/0012_projects.sql", import.meta.url), "utf8").replace(/--.*$/gm, "");
  assert.doesNotMatch(sql, /\b(DROP|DELETE|ALTER|RENAME)\b/i);
  const db = new DatabaseSync(":memory:");
  db.exec(sql);
  db.exec(sql);
});
