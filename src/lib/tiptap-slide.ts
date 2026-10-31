import { Node, mergeAttributes } from "@tiptap/core";
import { parseSlideUrl, SLIDE_IFRAME_ALLOW } from "@/lib/slide-embed";

/** True when the <p> holds nothing but one allowlisted Slides link. */
function soleSlideLink(el: HTMLElement): HTMLAnchorElement | null {
  const kids = Array.from(el.childNodes).filter((n) => !(n.nodeType === 3 && !(n.textContent ?? "").trim()));
  if (kids.length !== 1) return null;
  const a = kids[0] as HTMLElement;
  if (a.nodeType !== 1 || a.tagName !== "A") return null;
  return parseSlideUrl(a.getAttribute("href")) ? (a as HTMLAnchorElement) : null;
}

/**
 * Block Slides embed for the blog editor. Markdown: `[title](url)` alone in a
 * paragraph (same thing the public render turns into an iframe).
 */
export const SlideEmbed = Node.create({
  name: "slideEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return { src: { default: null }, title: { default: "" } };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-slide-embed]",
        getAttrs: (el) => {
          const src = (el as HTMLElement).getAttribute("data-slide-embed");
          return parseSlideUrl(src) ? { src, title: (el as HTMLElement).getAttribute("data-title") ?? "" } : false;
        },
      },
      {
        tag: "p",
        priority: 1000,
        getAttrs: (el) => {
          const a = soleSlideLink(el as HTMLElement);
          return a ? { src: a.getAttribute("href"), title: (a.textContent ?? "").trim() } : false;
        },
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const s = parseSlideUrl(node.attrs.src as string);
    const title = (node.attrs.title as string) || "Slides";
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "blog-embed", "data-slide-embed": node.attrs.src, "data-title": title, contenteditable: "false" }),
      s
        ? ["iframe", { src: s.embedSrc, title, allow: SLIDE_IFRAME_ALLOW, allowfullscreen: "true", loading: "lazy", class: "blog-embed-frame", referrerpolicy: "strict-origin-when-cross-origin" }]
        : ["span", {}, title],
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (s: string) => void; closeBlock: (n: unknown) => void; esc: (s: string) => string }, node: { attrs: { src: string; title: string } }) {
          const title = (node.attrs.title || "Slides").replace(/[[\]\\]/g, "");
          state.write(`[${title}](${node.attrs.src})`);
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },
});
