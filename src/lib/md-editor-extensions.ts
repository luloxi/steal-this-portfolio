import { mergeAttributes, type AnyExtension } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { SlideEmbed } from "@/lib/tiptap-slide";
import { VideoEmbed } from "@/lib/tiptap-video";

export { Editor } from "@tiptap/core";

/** CSS classes so the editable DOM looks exactly like the published render. */
export type MdClasses = {
  p?: string; h2?: string; h3?: string; h4?: string; ul?: string; ol?: string; li?: string;
  quote?: string; hr?: string; strong?: string; link?: string; code?: string; pre?: string;
  img?: string; table?: string; th?: string; td?: string;
};

export const COPY_CLASSES: MdClasses = {
  p: "cp-prose", h2: "md-h2", h3: "md-h3", h4: "md-h4", ul: "md-ul", ol: "md-ol",
  quote: "md-quote", hr: "md-hr", strong: "md-strong", link: "cp-prose-link",
};

export const BLOG_CLASSES: MdClasses = {
  p: "blog-p", h2: "blog-h2", h3: "blog-h3", h4: "blog-h3", ul: "blog-ul", ol: "blog-ol", li: "blog-li",
  quote: "blog-quote", hr: "blog-hr", strong: "blog-strong", link: "cp-prose-link",
  code: "blog-code", pre: "blog-pre", img: "blog-img", table: "blog-table", th: "blog-th", td: "blog-td",
};

const attrs = (cls?: string) => (cls ? { class: cls } : {});

/**
 * Editor schema shared by the in-place WYSIWYG editor and the fidelity tests.
 * Storage stays Markdown (tiptap-markdown). Site copy: single line break = hard
 * break (like remark-breaks). Blog: standard Markdown line handling.
 */
export function mdExtensions(opts: { blog?: boolean; classes?: MdClasses } = {}): AnyExtension[] {
  const c = opts.classes ?? (opts.blog ? BLOG_CLASSES : COPY_CLASSES);
  const levels = [2, 3, 4] as const;
  const headingClass: Record<number, string | undefined> = { 2: c.h2, 3: c.h3, 4: c.h4 };
  const exts: AnyExtension[] = [
    StarterKit.configure({
      heading: false,
      paragraph: { HTMLAttributes: attrs(c.p) },
      bulletList: { HTMLAttributes: attrs(c.ul) },
      orderedList: { HTMLAttributes: attrs(c.ol) },
      listItem: { HTMLAttributes: attrs(c.li) },
      blockquote: { HTMLAttributes: attrs(c.quote) },
      horizontalRule: { HTMLAttributes: attrs(c.hr) },
      bold: { HTMLAttributes: attrs(c.strong) },
      code: { HTMLAttributes: attrs(c.code) },
      codeBlock: { HTMLAttributes: attrs(c.pre) },
    }),
    Heading.extend({
      renderHTML({ node, HTMLAttributes }) {
        const level = node.attrs.level as number;
        return [`h${level}`, mergeAttributes(HTMLAttributes, attrs(headingClass[level])), 0];
      },
    }).configure({ levels: [...levels] }),
    Link.configure({ openOnClick: false, autolink: false, linkOnPaste: true, HTMLAttributes: { class: c.link, rel: "noopener noreferrer", target: null } }),
    Markdown.configure({ html: false, breaks: !opts.blog, linkify: false, tightLists: true, transformPastedText: true, transformCopiedText: true }),
  ];
  if (opts.blog) {
    exts.push(
      Image.configure({ HTMLAttributes: { ...attrs(c.img), loading: "lazy", decoding: "async" } }),
      VideoEmbed,
      SlideEmbed,
      Table.configure({ resizable: false, HTMLAttributes: attrs(c.table) }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: attrs(c.th) }),
      TableCell.configure({ HTMLAttributes: attrs(c.td) }),
    );
  }
  return exts;
}

/** Same escaping the public render applies: "* " at line start is a literal asterisk. */
export function prepCopyMarkdown(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/^([ \t]*)\*(?=[ \t])/gm, "$1\\*");
}
