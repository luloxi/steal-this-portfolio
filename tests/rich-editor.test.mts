import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>");
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Node: dom.window.Node,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  DOMParser: dom.window.DOMParser,
  getComputedStyle: dom.window.getComputedStyle,
  NodeFilter: dom.window.NodeFilter,
});

const test = (await import("node:test")).default;
const assert = (await import("node:assert/strict")).default;
const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const RM = (await import("react-markdown")).default;
const gfm = (await import("remark-gfm")).default;
const { Editor, mdExtensions } = await import("../src/lib/md-editor-extensions.ts");
const { remarkUnderline } = await import("../src/lib/underline-md.ts");
const { plainExcerpt } = await import("../src/lib/md-plain.ts");

const mdOf = (e: InstanceType<typeof Editor>) =>
  (e.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();

const round = (src: string, opts: { blog?: boolean; project?: boolean }) => {
  const e = new Editor({ extensions: mdExtensions(opts), content: src });
  const out = mdOf(e);
  e.destroy();
  return out;
};

const html = (src: string) =>
  renderToStaticMarkup(React.createElement(RM, { remarkPlugins: [gfm, remarkUnderline] }, src));

test("blog headings H1 to H3 round-trip", () => {
  const src = "# Uno\n\n## Dos\n\n### Tres\n\n#### Cuatro";
  const out = round(src, { blog: true });
  assert.match(out, /^# Uno/);
  assert.match(out, /## Dos/);
  assert.match(out, /### Tres/);
  assert.match(out, /#### Cuatro/);
});

test("project body keeps H1 and an uploaded image", () => {
  const src = "# Ficha\n\nTexto **fuerte** y ++subrayado++.\n\n![Mesa](/media/blog/2026/11111111-1111-1111-1111-111111111111.png)";
  const out = round(src, { project: true });
  assert.match(out, /# Ficha/);
  assert.match(out, /\*\*fuerte\*\*/);
  assert.match(out, /\+\+subrayado\+\+/);
  assert.match(out, /\/media\/blog\/2026\/11111111-1111-1111-1111-111111111111\.png/);
});

test("underline combines with bold and leaves C++ alone", () => {
  const out = round("C++ y ++**hola**++ y otro C++.", { blog: true });
  assert.match(out, /C\+\+/);
  assert.match(out, /\+\+/);
  assert.doesNotMatch(out, /<u>/);
  const rendered = html("C++ y ++**hola**++.");
  assert.match(rendered, /C\+\+/);
  assert.match(rendered, /<u class="rte-u"><strong>hola<\/strong><\/u>/);
});

test("underline does not eat code or a single C++", () => {
  const rendered = html("Usá `++no++` y C++.");
  assert.match(rendered, /\+\+no\+\+/);
  assert.match(rendered, /C\+\+/);
  assert.doesNotMatch(rendered, /<u/);
});

test("underline can wrap a link", () => {
  const rendered = html("++[sitio](https://lulox.com.ar)++");
  assert.match(rendered, /<u[^>]*>/);
  assert.match(rendered, /href="https:\/\/lulox.com.ar"/);
});

test("toggle commands write H1, underline and a link", () => {
  const e = new Editor({ extensions: mdExtensions({ project: true }), content: "hola" });
  e.chain().setTextSelection({ from: 1, to: 5 }).toggleUnderline().toggleBold().run();
  e.chain().setTextSelection(1).toggleHeading({ level: 1 }).run();
  const out = mdOf(e);
  e.destroy();
  assert.match(out, /# /);
  assert.match(out, /\+\+/);
  assert.match(out, /\*\*/);
});

test("plain excerpt drops marks and images", () => {
  assert.equal(
    plainExcerpt("# Hola\n\n**mundo** ++acá++ ![foto](/media/x.png) y [link](https://lulox.com.ar)."),
    "Hola mundo acá y link.",
  );
});

test("site copy schema still ignores a single hash heading", () => {
  const out = round("# No es titulo de copia\n\n## Si", {});
  assert.doesNotMatch(out, /^# No/);
  assert.match(out, /## Si/);
});
