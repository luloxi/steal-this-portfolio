import { Mark, markInputRule, mergeAttributes } from "@tiptap/core";
import { applyUnderlineDelimiters } from "@/lib/underline-md";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    underline: {
      setUnderline: () => ReturnType;
      toggleUnderline: () => ReturnType;
      unsetUnderline: () => ReturnType;
    };
  }
}

/** `++text++` while typing. The last group is the inner text (what markInputRule keeps). */
const inputRegex = /(?:^|\s)(\+\+(?!\s+\+\+)([^+]+)\+\+)$/;

/**
 * Underline mark. Markdown has no underline, so storage is `++text++`
 * (see underline-md.ts). Bold and italic still combine with it.
 */
export const Underline = Mark.create({
  name: "underline",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [{ tag: "u" }, { style: "text-decoration=underline" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setUnderline: () => ({ commands }) => commands.setMark(this.name),
      toggleUnderline: () => ({ commands }) => commands.toggleMark(this.name),
      unsetUnderline: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-u": () => this.editor.commands.toggleUnderline(),
      "Mod-U": () => this.editor.commands.toggleUnderline(),
    };
  },
  addInputRules() {
    return [markInputRule({ find: inputRegex, type: this.type })];
  },
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: "++",
          close: "++",
          mixable: true,
          expelEnclosingWhitespace: true,
        },
        parse: {
          updateDOM(element: HTMLElement) {
            applyUnderlineDelimiters(element);
          },
        },
      },
    };
  },
});
