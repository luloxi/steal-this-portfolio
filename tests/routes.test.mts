/** Bilingual URLs: es at the root, en under /en with translated segments; slugs. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  blogPostPath,
  enToEsPath,
  esToEnPath,
  isValidSlug,
  localeFromPath,
  localizePath,
  pathPair,
  slugify,
  switchLocalePath,
  uniqueSlug,
} from "../src/lib/routes.ts";
import { excerpt } from "../src/lib/page-metadata.ts";

const MAP: [string, string][] = [
  ["/", "/en"],
  ["/contratar", "/en/hire"],
  ["/sobre-mi", "/en/about"],
  ["/proyectos", "/en/projects"],
  ["/proyectos/demo", "/en/projects/demo"],
  ["/contacto", "/en/contact"],
  ["/privacidad", "/en/privacy"],
  ["/blog", "/en/blog"],
  ["/ingresar", "/en/sign-in"],
  ["/referidos", "/en/referrals"],
];

test("route map es <-> en is symmetric", () => {
  for (const [es, en] of MAP) {
    assert.equal(esToEnPath(es), en, es);
    assert.equal(enToEsPath(en), es, en);
    assert.deepEqual(pathPair(es), { es, en });
  }
  assert.equal(esToEnPath("/no-existe"), null);
  assert.equal(enToEsPath("/en/no-existe"), null);
  assert.equal(enToEsPath("/contratar"), null); // not an /en path
  assert.equal(enToEsPath("/english"), null);
});

test("the URL alone decides the language", () => {
  assert.equal(localeFromPath("/"), "es");
  assert.equal(localeFromPath("/contratar"), "es");
  assert.equal(localeFromPath("/en"), "en");
  assert.equal(localeFromPath("/en/hire"), "en");
  assert.equal(localeFromPath("/english"), "es");
  assert.equal(localeFromPath("/blog/en"), "es");
  assert.equal(localeFromPath(null), "es");
});

test("links: Spanish paths localized, external/hash/already-en untouched", () => {
  assert.equal(localizePath("es", "/contratar"), "/contratar");
  assert.equal(localizePath("en", "/contratar"), "/en/hire");
  assert.equal(localizePath("en", "/"), "/en");
  assert.equal(localizePath("en", "/proyectos/demo?x=1#a"), "/en/projects/demo?x=1#a");
  assert.equal(localizePath("en", "/en/blog"), "/en/blog");
  assert.equal(localizePath("en", "https://x.com/ExampleDev"), "https://x.com/ExampleDev");
  assert.equal(localizePath("en", "mailto:a@b.c"), "mailto:a@b.c");
  assert.equal(localizePath("en", "/no-existe"), "/no-existe");
});

test("blog post URLs: slug_en under /en, Spanish slug fallback when missing", () => {
  const p = { slug: "que-es-tokenizacion", slugEn: "what-tokenization-is" };
  assert.equal(blogPostPath("es", p), "/blog/que-es-tokenizacion");
  assert.equal(blogPostPath("en", p), "/en/blog/what-tokenization-is");
  assert.equal(blogPostPath("en", { slug: "x", slugEn: null }), "/en/blog/x");
  assert.equal(blogPostPath("en", { slug: "x" }), "/en/blog/x");
});

test("language selector fallback maps the current URL", () => {
  assert.equal(switchLocalePath("/contratar", "en"), "/en/hire");
  assert.equal(switchLocalePath("/en/hire", "es"), "/contratar");
  assert.equal(switchLocalePath("/en", "es"), "/");
  assert.equal(switchLocalePath("/", "en"), "/en");
  assert.equal(switchLocalePath("/blog/que-es", "en"), "/en/blog/que-es"); // proxy 301s to slug_en
  assert.equal(switchLocalePath("/contratar", "es"), "/contratar");
});

test("slugify: kebab-case, no accents, apostrophes dropped", () => {
  assert.equal(slugify("Why I stopped using Hermes Agent (and why I still keep an eye on it)"), "why-i-stopped-using-hermes-agent-and-why-i-still-keep-an-eye-on-it");
  assert.equal(slugify("Ünïcode Ñandú: Café — “quotes” & I'm here!!"), "unicode-nandu-cafe-quotes-im-here");
  assert.equal(slugify("CIP-113 vs ERC-3643"), "cip-113-vs-erc-3643");
  assert.equal(slugify("   "), "");
  assert.ok(isValidSlug("what-is-lcp-2"));
  for (const bad of ["", "Upper", "con-tilde-á", "a--b", "-a", "a-", "a b", "a_b", "x".repeat(121)]) assert.equal(isValidSlug(bad), false, bad);
  assert.equal(uniqueSlug("a", []), "a");
  assert.equal(uniqueSlug("a", ["a", "a-2"]), "a-3");
});

test("migration 0007 backfill: same slugs as slugify(), unique, fallback to slug_es", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8"));
  db.exec(readFileSync(new URL("../migrations/0003_post_topics.sql", import.meta.url), "utf8"));
  const ins = db.prepare(
    "INSERT INTO blog_posts (slug, published_at, title_es, title_en, summary_es, summary_en, body_es, body_en) VALUES (?, ?, 't', ?, '', '', '', '')",
  );
  const titles: [string, string, string][] = [
    ["hermes", "2026-08-02", "Why I stopped using Hermes Agent (and why I still keep an eye on it)"],
    ["acentos", "2026-01-01", "Ünïcode Ñandú: Café — “quotes” & I'm here!!"],
    ["mayus", "2026-01-02", "ÁÉÍÓÚ Upper"],
    ["uno", "2026-01-03", "Same Title"],
    ["dos", "2026-01-04", "same title"],
    ["vacio", "2026-01-05", "  "],
    ["cip", "2026-01-06", "CIP-113 vs ERC-3643"],
  ];
  for (const t of titles) ins.run(...t);
  db.exec(readFileSync(new URL("../migrations/0007_blog_slug_en.sql", import.meta.url), "utf8"));
  const got = Object.fromEntries(
    (db.prepare("SELECT slug, slug_en FROM blog_posts").all() as { slug: string; slug_en: string }[]).map((r) => [r.slug, r.slug_en]),
  );
  for (const [slug, , title] of titles) {
    if (slug === "dos" || slug === "vacio") continue;
    assert.equal(got[slug], slugify(title), slug);
  }
  assert.equal(got.uno, "same-title"); // oldest keeps the plain slug
  assert.equal(got.dos, "same-title-2");
  assert.equal(got.vacio, "vacio"); // no title_en -> Spanish slug
  // additive: every old column still there, and the unique index holds
  const cols = (db.prepare("PRAGMA table_info(blog_posts)").all() as { name: string }[]).map((c) => c.name);
  for (const c of ["slug", "title_es", "title_en", "summary_es", "summary_en", "body_es", "body_en", "published", "topics", "slug_en"]) assert.ok(cols.includes(c), c);
  assert.throws(() => db.prepare("UPDATE blog_posts SET slug_en = 'same-title' WHERE slug = 'cip'").run());
  // NULLs don't collide
  db.prepare("UPDATE blog_posts SET slug_en = NULL WHERE slug IN ('cip', 'mayus')").run();
});

test("share excerpt: plain text, cut at a word", () => {
  assert.equal(excerpt("## Title\n\nSome **bold** [link](https://x.y) text."), "Title Some bold link text.");
  const long = excerpt("word ".repeat(80), 40);
  assert.ok(long.length <= 41 && long.endsWith("…"));
});
