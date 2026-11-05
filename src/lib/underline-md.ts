/**
 * Underline in stored Markdown is `++text++` (there is no CommonMark mark for it).
 * `C++` stays literal: a delimiter only opens when it is not stuck to a word.
 */

const WORD = /[\p{L}\p{N}_]/u;

function isWord(ch: string): boolean {
  return ch !== "" && WORD.test(ch);
}

type Piece =
  | { kind: "text"; value: string }
  | { kind: "node"; node: MdNode };

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
  [key: string]: unknown;
};

const INLINE_PARENT = new Set([
  "paragraph",
  "heading",
  "link",
  "emphasis",
  "strong",
  "delete",
  "tableCell",
  "tableHeader",
]);

function edgeOf(pieces: Piece[], index: number, dir: -1 | 1): string {
  for (let i = index + dir; i >= 0 && i < pieces.length; i += dir) {
    const p = pieces[i];
    if (p.kind === "text") {
      if (!p.value) continue;
      return dir === -1 ? (p.value.at(-1) ?? "") : p.value[0];
    }
    const ch = edgeOfNode(p.node, dir);
    if (ch) return ch;
  }
  return "";
}

function edgeOfNode(node: MdNode, dir: -1 | 1): string {
  if (node.type === "text") {
    const v = node.value ?? "";
    return dir === -1 ? (v.at(-1) ?? "") : (v[0] ?? "");
  }
  if (node.type === "inlineCode" || node.type === "code") return "x";
  const kids = node.children ?? [];
  if (!kids.length) return "";
  return edgeOfNode(dir === -1 ? kids[kids.length - 1] : kids[0], dir);
}

function canOpen(pieces: Piece[], index: number): boolean {
  const before = edgeOf(pieces, index, -1);
  const after = edgeOf(pieces, index, 1);
  if (!after || /\s/.test(after)) return false;
  if (isWord(before)) return false;
  return true;
}

function canClose(pieces: Piece[], index: number): boolean {
  const before = edgeOf(pieces, index, -1);
  const after = edgeOf(pieces, index, 1);
  if (!before || /\s/.test(before)) return false;
  if (isWord(after)) return false;
  return true;
}

function pieceToNode(p: Piece): MdNode {
  return p.kind === "text" ? { type: "text", value: p.value } : p.node;
}

function mergeText(nodes: MdNode[]): MdNode[] {
  const out: MdNode[] = [];
  for (const n of nodes) {
    const prev = out[out.length - 1];
    if (n.type === "text" && prev?.type === "text") prev.value = (prev.value ?? "") + (n.value ?? "");
    else if (n.type === "text" && !n.value) continue;
    else out.push(n);
  }
  return out;
}

function splitText(value: string): Piece[] {
  const out: Piece[] = [];
  const re = /\+\+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value))) {
    if (m.index > last) out.push({ kind: "text", value: value.slice(last, m.index) });
    out.push({ kind: "text", value: "++" });
    last = m.index + 2;
  }
  if (last === 0) return [{ kind: "text", value }];
  if (last < value.length) out.push({ kind: "text", value: value.slice(last) });
  return out;
}

function pairChildren(children: MdNode[]): MdNode[] {
  const pieces: Piece[] = [];
  for (const child of children) {
    if (child.type === "text" && typeof child.value === "string" && child.value.includes("++")) {
      pieces.push(...splitText(child.value));
    } else if (child.type === "text" && typeof child.value === "string") {
      pieces.push({ kind: "text", value: child.value });
    } else {
      pieces.push({ kind: "node", node: child });
    }
  }
  const delims = pieces
    .map((p, i) => (p.kind === "text" && p.value === "++" ? i : -1))
    .filter((i) => i >= 0);
  if (delims.length < 2) return children;

  const match = new Map<number, number>();
  const stack: number[] = [];
  for (const i of delims) {
    const open = canOpen(pieces, i);
    const close = canClose(pieces, i);
    if (close && stack.length) {
      const from = stack.pop()!;
      if (pieces.slice(from + 1, i).some((p) => p.kind === "node" || (p.kind === "text" && p.value !== ""))) {
        match.set(from, i);
      }
      continue;
    }
    if (open) stack.push(i);
  }
  if (!match.size) return children;

  const used = new Set<number>();
  const out: MdNode[] = [];
  for (let i = 0; i < pieces.length; i++) {
    if (used.has(i)) continue;
    const end = match.get(i);
    if (end === undefined) {
      out.push(pieceToNode(pieces[i]));
      continue;
    }
    const inner = pieces.slice(i + 1, end).map(pieceToNode);
    out.push({
      type: "underline",
      data: { hName: "u", hProperties: { className: ["rte-u"] } },
      children: mergeText(inner),
    });
    for (let k = i; k <= end; k++) used.add(k);
  }
  return mergeText(out);
}

function visit(node: MdNode): void {
  if (node.type === "code" || node.type === "inlineCode" || node.type === "html") return;
  if (!node.children) return;
  for (const child of node.children) visit(child);
  if (INLINE_PARENT.has(node.type)) node.children = pairChildren(node.children);
}

/** remark plugin: `++text++` becomes `<u class="rte-u">`. Code spans are left alone. */
export function remarkUnderline() {
  return (tree: MdNode) => {
    visit(tree);
  };
}

type Tok = { node: Text; index: number };

function neighborChar(node: Text, dir: -1 | 1): string {
  let cur: Node | null = node;
  while (cur) {
    const sib: Node | null = dir === -1 ? cur.previousSibling : cur.nextSibling;
    if (sib) {
      const ch = edgeChar(sib, dir);
      if (ch) return ch;
      cur = sib;
      continue;
    }
    const parent: Node | null = cur.parentNode;
    if (!parent || (parent instanceof Element && /^(P|H[1-6]|TD|TH|LI|DIV|BODY|BLOCKQUOTE)$/.test(parent.tagName))) return "";
    cur = parent;
  }
  return "";
}

function edgeChar(node: Node, dir: -1 | 1): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const v = node.nodeValue ?? "";
    return dir === -1 ? (v.at(-1) ?? "") : (v[0] ?? "");
  }
  if (node instanceof Element) {
    if (node.tagName === "BR") return "\n";
    if (node.closest("pre, code") && node.tagName !== "CODE") return "x";
    const child = dir === -1 ? node.lastChild : node.firstChild;
    return child ? edgeChar(child, dir) : "";
  }
  return "";
}

function charAround(tok: Tok, dir: -1 | 1): string {
  const v = tok.node.nodeValue ?? "";
  const at = dir === -1 ? tok.index - 1 : tok.index + 2;
  if (at >= 0 && at < v.length) return v[at] ?? "";
  return neighborChar(tok.node, dir);
}

function domCanOpen(tok: Tok): boolean {
  const before = charAround(tok, -1);
  const after = charAround(tok, 1);
  if (!after || /\s/.test(after)) return false;
  if (isWord(before)) return false;
  return true;
}

function domCanClose(tok: Tok): boolean {
  const before = charAround(tok, -1);
  const after = charAround(tok, 1);
  if (!before || /\s/.test(before)) return false;
  if (isWord(after)) return false;
  return true;
}

function tokensIn(el: HTMLElement): Tok[] {
  const out: Tok[] = [];
  const doc = el.ownerDocument;
  // 4 = NodeFilter.SHOW_TEXT. The constant is not always a global (jsdom tests).
  const walker = doc.createTreeWalker(el, 4);
  let n: Node | null = walker.nextNode();
  while (n) {
    const parent = (n as Text).parentElement;
    if (!parent?.closest("pre, code")) {
      const v = n.nodeValue ?? "";
      for (let i = 0; i < v.length - 1; i++) {
        if (v[i] === "+" && v[i + 1] === "+") {
          out.push({ node: n as Text, index: i });
          i += 1;
        }
      }
    }
    n = walker.nextNode();
  }
  return out;
}

function hasInner(open: Tok, close: Tok): boolean {
  if (open.node !== close.node) return true;
  return close.index > open.index + 2;
}

function applyPair(open: Tok, close: Tok): void {
  const ov = open.node.nodeValue ?? "";
  open.node.nodeValue = ov.slice(0, open.index) + ov.slice(open.index + 2);
  if (close.node === open.node) close.index -= 2;
  const cv = close.node.nodeValue ?? "";
  close.node.nodeValue = cv.slice(0, close.index) + cv.slice(close.index + 2);
  const range = open.node.ownerDocument.createRange();
  range.setStart(open.node, open.index);
  range.setEnd(close.node, close.index);
  if (range.collapsed) return;
  const u = open.node.ownerDocument.createElement("u");
  range.surroundContents(u);
}

/** Turn `++text++` left in markdown-it's HTML into `<u>` before ProseMirror parses it. */
export function applyUnderlineDelimiters(root: ParentNode): void {
  const blocks: Element[] = [];
  if (root instanceof Element && /^(P|H[1-6]|TD|TH)$/.test(root.tagName)) blocks.push(root);
  root.querySelectorAll?.("p, h1, h2, h3, h4, h5, h6, td, th").forEach((el) => blocks.push(el));
  for (const el of blocks) {
    const toks = tokensIn(el as HTMLElement);
    if (toks.length < 2) continue;
    const pairs: [Tok, Tok][] = [];
    const stack: Tok[] = [];
    for (const tok of toks) {
      if (domCanClose(tok) && stack.length) {
        const open = stack.pop()!;
        if (hasInner(open, tok)) pairs.push([open, tok]);
        continue;
      }
      if (domCanOpen(tok)) stack.push(tok);
    }
    for (const [open, close] of pairs.reverse()) {
      try {
        applyPair(open, close);
      } catch {
        // A range that splits a node stays as literal pluses.
      }
    }
  }
}
