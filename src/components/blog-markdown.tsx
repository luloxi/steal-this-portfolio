"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { linkifyBlogTerms } from "@/lib/blog-linkify";
import { remarkUnderline } from "@/lib/underline-md";
import { parseSlideUrl, SLIDE_IFRAME_ALLOW } from "@/lib/slide-embed";
import { parseVideoUrl, VIDEO_IFRAME_ALLOW } from "@/lib/video-embed";
import { MagicHr } from "@/components/magic-hr";

const components: Components = {
  h1: ({ children }) => <h1 className="blog-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="blog-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="blog-h3">{children}</h3>,
  // A paragraph that is only an allowlisted YouTube/Vimeo or Google Slides
  // link becomes a responsive embed; the iframe src is rebuilt from the validated id.
  p: ({ node, children }) => {
    const kids = (node?.children ?? []).filter((c) => !(c.type === "text" && !c.value.trim()));
    const only = kids.length === 1 && kids[0].type === "element" && kids[0].tagName === "a" ? kids[0] : null;
    const href = only ? String(only.properties?.href ?? "") : "";
    const v = only ? parseVideoUrl(href) : null;
    const s = !v && only ? parseSlideUrl(href) : null;
    const embed = v ? { src: v.embedSrc, allow: VIDEO_IFRAME_ALLOW, fallback: v.provider === "vimeo" ? "Vimeo" : "YouTube" } : s ? { src: s.embedSrc, allow: SLIDE_IFRAME_ALLOW, fallback: "Slides" } : null;
    if (embed && only) {
      const title = only.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim() || embed.fallback;
      return (
        <div className="blog-embed">
          <iframe
            src={embed.src}
            title={title}
            allow={embed.allow}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="blog-embed-frame"
          />
        </div>
      );
    }
    return <p className="blog-p">{children}</p>;
  },
  ul: ({ children }) => <ul className="blog-ul">{children}</ul>,
  ol: ({ children }) => <ol className="blog-ol">{children}</ol>,
  li: ({ children }) => <li className="blog-li">{children}</li>,
  strong: ({ children }) => <strong className="blog-strong">{children}</strong>,
  u: ({ children }) => <u className="rte-u">{children}</u>,
  blockquote: ({ children }) => (
    <blockquote className="blog-quote">{children}</blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className?.includes("language-")) || String(children).includes("\n");
    if (isBlock) {
      return (
        <pre className="blog-pre">
          <code className={className}>{children}</code>
        </pre>
      );
    }
    return <code className="blog-code">{children}</code>;
  },
  pre: ({ children }) => <>{children}</>,
  a: ({ href, children }) => {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="cp-prose-link"
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") return null;
    if (!/^(https?:\/\/|\/)/i.test(src)) return null;
    return (
      <span className="blog-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} className="blog-img" loading="lazy" decoding="async" />
        {alt ? <span className="blog-figcaption">{alt}</span> : null}
      </span>
    );
  },
  table: ({ children }) => (
    <div className="blog-table-wrap">
      <table className="blog-table">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="blog-th">{children}</th>,
  td: ({ children }) => <td className="blog-td">{children}</td>,
  hr: () => <MagicHr />,
};

export function BlogMarkdown({ content }: { content: string }) {
  const linked = linkifyBlogTerms(content);

  return (
    <div className="blog-md">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkUnderline]} components={components}>
        {linked}
      </ReactMarkdown>
    </div>
  );
}
