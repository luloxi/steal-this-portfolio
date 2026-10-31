import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Node: dom.window.Node,
  HTMLElement: dom.window.HTMLElement,
  DOMParser: dom.window.DOMParser,
  getComputedStyle: dom.window.getComputedStyle,
  Element: dom.window.Element,
});

const test = (await import("node:test")).default;
const assert = (await import("node:assert/strict")).default;
const { parseSlideUrl } = await import("../src/lib/slide-embed.ts");
const { Editor, mdExtensions } = await import("../src/lib/md-editor-extensions.ts");
const { BlogMarkdown } = await import("../src/components/blog-markdown.tsx");

const ID = "abcdefghijklmnopqrst";
const LONG = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
const EMBED = `https://docs.google.com/presentation/d/${ID}/embed`;

test("allowlisted Google Slides URLs parse to an embed src", () => {
  for (const u of [
    `https://docs.google.com/presentation/d/${ID}/edit`,
    `https://docs.google.com/presentation/d/${ID}/embed`,
    `https://docs.google.com/presentation/d/${ID}`,
    `https://docs.google.com/presentation/d/${ID}/edit?usp=sharing`,
    `https://docs.google.com/presentation/d/${ID}/pub`,
    `https://docs.google.com/presentation/d/${LONG}/edit#slide=id.p`,
  ]) {
    const id = u.includes(LONG) ? LONG : ID;
    assert.equal(parseSlideUrl(u)?.embedSrc, `https://docs.google.com/presentation/d/${id}/embed`, u);
    assert.equal(parseSlideUrl(u)?.id, id, u);
  }
});

test("other slide URLs are rejected", () => {
  for (const u of [
    "javascript:alert(1)",
    "http://docs.google.com/presentation/d/abcdefghijklmnopqrst/edit",
    "https://evil.com/presentation/d/abcdefghijklmnopqrst/edit",
    "https://docs.google.com.evil.com/presentation/d/abcdefghijklmnopqrst/edit",
    "https://user:pw@docs.google.com/presentation/d/abcdefghijklmnopqrst/edit",
    "https://docs.google.com:8443/presentation/d/abcdefghijklmnopqrst/edit",
    "https://docs.google.com/document/d/abcdefghijklmnopqrst/edit",
    "https://docs.google.com/presentation/d/short/edit",
    "https://docs.google.com/presentation/u/0/d/abcdefghijklmnopqrst/edit",
    "https://slides.google.com/presentation/d/abcdefghijklmnopqrst/edit",
    "data:text/html,x",
    "",
  ]) {
    assert.equal(parseSlideUrl(u), null, u);
  }
  assert.equal(EMBED, `https://docs.google.com/presentation/d/${ID}/embed`);
});

const rt = (md: string) => {
  const e = new Editor({ extensions: mdExtensions({ blog: true }), content: md });
  const json = e.getJSON();
  const out = (e.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();
  e.destroy();
  return { json, out };
};

test("a paragraph with only a Slides link becomes a slide node and round-trips", () => {
  const md = `Intro\n\n[Mi deck](https://docs.google.com/presentation/d/${ID}/edit)\n\nFin`;
  const { json, out } = rt(md);
  const raw = JSON.stringify(json);
  assert.ok(raw.includes('"slideEmbed"'));
  assert.ok(!raw.includes('"videoEmbed"'));
  assert.equal(out.trim(), md);
});

test("inline Slides links stay links, and a video paragraph stays a video", () => {
  const inline = `Mirá [esto](https://docs.google.com/presentation/d/${ID}/edit) ahora`;
  const inlineJson = JSON.stringify(rt(inline).json);
  assert.ok(!inlineJson.includes('"slideEmbed"'));
  assert.equal(rt(inline).out.trim(), inline);

  const video = "Intro\n\n[Mi charla](https://www.youtube.com/watch?v=dQw4w9WgXcQ)\n\nFin";
  const videoJson = JSON.stringify(rt(video).json);
  assert.ok(videoJson.includes('"videoEmbed"'));
  assert.ok(!videoJson.includes('"slideEmbed"'));
});

test("public markdown renders a Slides iframe and an assets image", () => {
  const slide = renderToStaticMarkup(createElement(BlogMarkdown, {
    content: `Texto\n\n[Deck](https://docs.google.com/presentation/d/${ID}/edit?usp=sharing)\n`,
  }));
  assert.match(slide, new RegExp(`src="${EMBED.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(slide, /<iframe/);
  assert.equal(slide.includes("/edit"), false);

  const img = "https://assets.lulox.com.ar/blog/2026/123e4567-e89b-12d3-a456-426614174000.png";
  const html = renderToStaticMarkup(createElement(BlogMarkdown, { content: `![portada](${img})` }));
  assert.match(html, /src="https:\/\/assets\.lulox\.com\.ar\/blog\/2026\/123e4567-e89b-12d3-a456-426614174000\.png"/);

  const local = renderToStaticMarkup(createElement(BlogMarkdown, {
    content: "![x](https://lulox.com.ar/media/blog/2026/123e4567-e89b-12d3-a456-426614174000.webp)",
  }));
  assert.match(local, /lulox\.com\.ar\/media\/blog\/2026\/123e4567-e89b-12d3-a456-426614174000\.webp/);

  const blocked = renderToStaticMarkup(createElement(BlogMarkdown, { content: "![x](javascript:alert(1))" }));
  assert.equal(blocked.includes("<img"), false);
});
