# Project instructions for AI agents

## Writing style (non-negotiable)

- **Never use em dashes (`—`)** in user-facing copy, UI strings, blog posts, comments that ship as docs, or any text the visitor can read.
- Prefer commas, periods, colons, parentheses, or a short new sentence instead.
- Date ranges: use a regular hyphen with spaces (`2024 - Present`), not an em dash.
- Avoid en dashes (`–`) as decorative separators in prose for the same reason; rephrase instead.
- Tone: personal, clear, not corporate and not "AI essay". No hype filler.

This rule applies to **every** change in this repo: new copy, edits, translations, and README updates.

## README (non-negotiable)

- **Update `README.md` (Spanish) and `README.en.md` (English) with every change** that touches features, routes, file paths, scripts, env var names or config. Keep both languages in sync.
- Never put secret values in the README or `.dev.vars.example`: names only.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
