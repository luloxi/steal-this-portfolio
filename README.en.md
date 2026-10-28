[Español](README.md) | **English**

# Steal this portfolio! 🦝

The personal site of Luciano Oliva Bianco (Lulox), live at **https://lulox.com.ar**.
It's a simple, bilingual (ES/EN) portfolio with a blog, an inline admin editor and a quote calculator, running on one Cloudflare Worker.
Fork it, swap the content, deploy. That's the whole idea. ✨
It's copyleft on purpose: take it, make it better, and keep it open for the next person. 🏴‍☠️

## ✨ Features

- 🏠 **Landing**: photo, name and a menu (Contratar, Blog, Sobre mí, Proyectos, Contacto). Screen-sized on desktop, made to fit the first screen on mobile.
- ✍️ **Blog** with a Markdown/WYSIWYG editor, drafts, cover images (uploaded to R2) and drag-and-drop section reordering.
- 👤 **Sobre mí** (about): your story, experience cards and your publications (article citations), editable inline when you're signed in as admin.
- 🧪 **Proyectos**: project cards and detail pages.
- 💸 **Contratar** (hire me): a quote calculator plus a contact form that emails you the visitor's message and their quote.
- 🌗 Dark and light themes, 🇦🇷/🇺🇸 Spanish and English.
- 🎛️ Admin strip (edit mode): hide, show and reorder sections and projects without deleting anything.
- 🔐 Google sign-in for anyone; admin only for the emails you allow.
- 🤝 **Referrals**: anyone with a Google account creates a code and earns 15% of what the client they bring pays; payout register for the admin.

## 🧰 Stack

- [Next.js](https://nextjs.org) (App Router) built for Cloudflare with [OpenNext](https://opennext.js.org/cloudflare)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) + **D1** (SQLite) + **R2** (media) + Rate Limiting
- [Better Auth](https://www.better-auth.com) with Google sign-in
- [Resend](https://resend.com) for the contact form email (Cloudflare Email Routing `send_email` as fallback)
- Tailwind CSS 4, TypeScript, `tsx --test` for tests

## 🚀 Quick start

You need **Node.js 24.22.1+** (the latest LTS; pinned in `.nvmrc`, run `nvm use`) and a free Cloudflare account (only for deploying).
**pnpm is recommended** (the repo pins it in `package.json`); npm works too.

```bash
# 1. Install
pnpm install                 # or: npm install

# 2. Env vars (local secrets, git-ignored)
cp .dev.vars.example .dev.vars
# fill in BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TURNSTILE_SECRET_KEY (RESEND_API_KEY optional)

# 3. Local database (D1 in .wrangler/state) + sample posts
pnpm db:migrate:local        # or: npm run db:migrate:local
pnpm seed:blog               # or: npm run seed:blog

# 4. Run it
pnpm dev                     # or: npm run dev  → http://localhost:3000
```

### Env vars

| Name | Where | What |
|---|---|---|
| `BETTER_AUTH_SECRET` | secret | Random string for sessions |
| `BETTER_AUTH_URL` | optional | Public site URL |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | secret | Google OAuth client. Redirect URI: `<site>/api/auth/callback/google` |
| `RESEND_API_KEY` | optional secret | Sends the contact form email |
| `TURNSTILE_SECRET_KEY` | secret | Cloudflare Turnstile secret. The /contratar form verifies the token server-side (siteverify) before sending; without it the form returns 503. The public site key lives in `src/content/site.ts` (`turnstileSiteKey`); if you fork, create your own widget (domains: yours and `localhost`) and swap it |
| `CONTACT_RL`, `REF_CHECK_RL` | `ratelimits` in `wrangler.jsonc` | Rate limit for the form and referral signup (5/min per IP) and for the live code check (60/min per IP) |
| `CONTACT_TO`, `CONTACT_FROM`, `CONTACT_INBOX` | `vars` in `wrangler.jsonc` | Where the form email goes, the sender (a domain verified in Resend) and the inbox for your copy |

Locally they live in `.dev.vars`. In production: `npx wrangler secret put <NAME>`.

### Everyday commands

| pnpm | npm | Does |
|---|---|---|
| `pnpm test` | `npm test` | Unit tests (`tests/*.test.mts`) |
| `pnpm typecheck` | `npm run typecheck` | TypeScript check |
| `pnpm lint` | `npm run lint` | ESLint |
| `pnpm cf:build` | `npm run cf:build` | Production build for Cloudflare |
| `pnpm preview` | `npm run preview` | Build + run the real Worker locally |
| `pnpm run deploy` | `npm run deploy` | Build + deploy to Cloudflare |

### ☁️ Deploy to Cloudflare

1. `npx wrangler login`
2. Create your own resources and put their names/ids in `wrangler.jsonc`:
   - `npx wrangler d1 create <your-db>` (copy `database_id`)
   - `npx wrangler r2 bucket create <your-bucket>`
   - change `name`, `routes` (your domain), the `send_email` destination and `vars` (`CONTACT_TO`, `CONTACT_FROM`, `CONTACT_INBOX`)
3. `pnpm db:migrate:remote` (the script uses the `DB` binding from `wrangler.jsonc`, not the db name, so no need to edit `package.json`)
4. Set secrets: `npx wrangler secret put BETTER_AUTH_SECRET` (same for the Google ones, `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY`)
5. `pnpm run deploy` (if it fails the first time, just run it again)

## 🎨 Make it yours

**Do this first** 👇
- `src/content/site.ts`: name, menu sections, socials, taste links, `CALL_BOOKING_URL` (your calendar booking page).
- `src/lib/auth/admin.ts`: `ADMIN_EMAILS`, the only Google accounts that can edit. Any other account can sign in but is a plain user: no edit mode, no admin, no drafts (every admin API answers 401/403), and it only sees its own referral panel.
- `src/lib/auth/options.ts`: `ALLOWED_HOSTS` and `TRUSTED_ORIGINS` (your domains, or sign-in will refuse them).
- `public/`: replace the photos (`avatar*.jpg`), project images and logos.
- `public/og.png`: the share preview image (og:image/twitter:image, 1200x630), a top-anchored crop of `avatar-hero.jpg`. Regenerate it if you change the photo. Posts with a cover image use their own cover.
- **Two-language URLs:** Spanish lives at the root and English under `/en` with translated routes: `/` ↔ `/en`, `/contratar` ↔ `/en/hire`, `/sobre-mi` ↔ `/en/about`, `/proyectos(/<id>)` ↔ `/en/projects(/<id>)`, `/contacto` ↔ `/en/contact`, `/privacidad` ↔ `/en/privacy`, `/blog` ↔ `/en/blog`, `/blog/<slug>` ↔ `/en/blog/<slug_en>`, `/ingresar` ↔ `/en/sign-in`, `/referidos` ↔ `/en/referrals` (`/en/tastes` and `/en/gustos` go to `/en/about`). **The URL sets the language**, for the content and the metadata: `src/proxy.ts` sets the `x-lulox-locale` header from the path (overwriting any client value) and rewrites `/en/...` to the Spanish page that renders it. The `lulox-locale` cookie only remembers the last choice in the language switch; it is never used to redirect or pick a language (neither is `Accept-Language`). The switch opens the same page in the other language (on an article, its other slug, read from the page's `hreflang`). The map lives in `src/lib/routes.ts` (`SEGMENTS_ES_TO_EN`); internal links are written in Spanish and go through `href()` from `useLocale()`. Old English paths at the root (`/about`, `/projects`, `/contact`, `/privacy`, `/login`) keep redirecting to the Spanish ones as before.
- **Share cards (SEO):** every URL has its own `og:title`, `og:description`, `twitter:*`, `og:url` and `canonical`, in the URL's language: `og:locale` `es_AR` at the root and `en_US` under `/en` (no cookies, no `Accept-Language`). Every page has `hreflang` `es-AR`, `en-US` and `x-default` (= Spanish), and `sitemap.xml` lists both versions of each page with their alternates. Format is "Page | Lulox"; the home stays "Lulox". Articles use their title and `summary` in that language (if the summary is missing, the start of the article); other pages have their own short description in each language. The helper is `src/lib/page-metadata.ts` (`pageMetadata("/spanish-path", { es, en })`); each route's copy lives in its `layout.tsx` (or `privacidad/page.tsx`). When you add a route, add it to `SEGMENTS_ES_TO_EN` and give it a `pageMetadata(...)` call.
- `wrangler.jsonc` and the footer link in `src/app/page.tsx`.

**Section by section**

| Section | Route | Files | How to edit |
|---|---|---|---|
| Landing + menu | `/` | `src/app/page.tsx`, `src/components/section-nav.tsx`, `src/components/hire-button.tsx` | Default menu items and order: `sections` in `src/content/site.ts` (`hire` renders as the glowing pill). The admin can hide and reorder them from the edit-mode strip (see "Sections and projects"). On desktop the "lulox" title is centered over the menu buttons, with no line under it. |
| Blog | `/blog`, `/blog/[slug]`, `/en/blog`, `/en/blog/<slug_en>` | `src/app/blog/`, `src/components/views/blog-*.tsx`, `src/lib/blog.ts` | Posts live in D1 (`blog_posts`). Sign in as admin and write at `/blog/nuevo` or edit any post. Sample posts: `src/content/blog/seed.ts`. Each post has `slug` (Spanish, the key) and `slug_en` (English, column from migration `0007_blog_slug_en.sql`, backfilled from `title_en`). The editor changes both ("slug (ES)" and "slug (EN)"); the server checks that `slug_en` is lowercase kebab-case without accents and not used by another post (as `slug_en` or `slug`). Left empty, publishing generates it from `title_en`; a draft may have no `slug_en` and is served at `/en/blog/<slug>`. `/en/blog/<slug>` (Spanish slug) 301s to `/en/blog/<slug_en>` and `/blog/<slug_en>` 301s to `/blog/<slug>`. Apply migration 0007 before deploying this change (`pnpm db:migrate:remote`). Drafts: only the admin with edit mode ON sees them (`lulox-edit-mode` cookie, mirrored from localStorage, see `src/lib/edit-mode.ts`); with edit mode OFF the admin sees the blog as a visitor (no drafts in the list, a draft slug returns 404). |
| Blog editor extras | | `src/components/blog-post-edit.tsx`, `md-wysiwyg.tsx`, `section-reorder.tsx`, `src/lib/article-sections.ts` | Covers and images upload to R2 (`/api/media`, served at `/media/...`). "Section order" splits the post by headings and `---` and lets you drag sections. |
| Sobre mí | `/sobre-mi` | `src/app/sobre-mi/page.tsx`, `src/components/views/about-view.tsx`, `src/lib/page-layout.ts`, `src/lib/md-sections.ts` | Default text and experience cards (`about.timeline`) are in `src/i18n/messages.ts`. As admin you edit inline and add sections; edits are saved to D1 (`site_copy`) and win over the code. The section animation (the peek at the first lines of "Primeros pasos" and the header shake) pauses while off-screen and resumes when it is back (`IntersectionObserver` in `src/components/copy-markdown.tsx`); with `prefers-reduced-motion` there is no animation. |
| Publications (Sobre mí) | `/sobre-mi`, `/en/about`, `PUT /api/publications` | `src/components/publications.tsx`, `src/lib/publications.ts`, `src/lib/publications-db.ts`, `src/lib/publications-api.ts`, `src/app/api/publications/route.ts`, `src/components/views/about-view.tsx`, `migrations/0011_publications.sql`, `scripts/sql/about-publications-copy.sql` | A block of its own, "Publicaciones" / "Publications", for citing articles, different from the experience cards: a numbered list with the title (link in a new tab, `rel="noopener noreferrer"`, the whole entry is clickable), a short note per language and the citation (authors · year · venue). It sits right below the "Agentes e investigación" / "Agents and research" story: in the layout (`about.layout`) it is the `pubs:0` token, after `story:4`; a saved layout without the token puts it after the last story, and a body with no `## ` sections shows it at the end of the text. The title shows as published; `title_en` is only used when a real English version exists. With no D1 rows (or no table) the two default articles from `DEFAULT_PUBLICATIONS` show. As admin with edit mode on: add, edit (title, English title, ES/EN note, authors, year, venue, link), reorder (↑ ↓), remove and restore; changes stay local until "Save" (`PUT /api/publications`, 401 without a session, 403 if you are not admin or edit mode is off). Strict validation (`validatePublicationsPayload`): the whole list (max 30), ids `a-z 0-9 -`, `https://` links only with no user/password (max 600), title 1 to 300, notes up to 160, authors up to 400, venue up to 80, year a whole number 1900 to 2100 or empty, `hidden` boolean, no extra fields. D1 `publications`: only `INSERT ... ON CONFLICT DO UPDATE` and `UPDATE`; remove is `hidden = 1` (never `DELETE`) and a row missing from a save gets hidden. Visitors (and the admin with edit mode off) never receive hidden ones; `/sobre-mi` renders per request (`force-dynamic`). Old copy: if a story still ends with the list of links to these publications, it is left out when rendering (`stripPublicationLinks`); edit mode shows the stored text as is. The D1 copy change (closing the sentence without the links, ES and EN) is manual: `scripts/sql/about-publications-copy.sql` (UPDATE by `key` + `locale`, only if the current text matches; running it twice does nothing). Apply migration 0011 before deploying (`pnpm db:migrate:remote`); without it the site shows the defaults, but saving fails. |
| Links (LinkedIn + tastes) | bottom of `/sobre-mi` | `src/app/sobre-mi/page.tsx`, `tasteLinks` in `src/content/site.ts`, copy in `src/i18n/messages.ts` (`about.linkedInCta`/`about.linkedInDetail`, `tastes.platforms`) | One untitled group of four buttons: LinkedIn (blue), Letterboxd, Last.fm and Spotify, each with a title and a short description. `/tastes` and `/gustos` redirect to `/sobre-mi`. Everything clickable gets `cursor: pointer` (disabled: `not-allowed`). |
| Proyectos | `/proyectos`, `/proyectos/[id]` | `src/content/projects.ts`, `src/components/views/project*.tsx` | Add projects in `projects.ts` (ids: `djtube`, `mochi`, `sami`, `punksociety`). DJTube is first and the only live one (live URL: https://dj.lulox.com.ar). Admin can override status and texts (stored in D1 `project_overrides`) and hide or reorder each project from the edit-mode strip (D1 `project_settings`). If `project_settings` already has rows, a new project with no row lands at the end: to put DJTube first, reorder it from that strip. |
| Sections and projects (admin) | `/` and `/en` (landing only) | `src/components/admin-strip.tsx`, `src/components/site-order-context.tsx`, `src/lib/site-sections.ts`, `src/lib/site-order.ts`, `src/app/api/sections/route.ts`, `migrations/0008_site_sections.sql` | Signed in as admin with edit mode on, a text strip (titles only) shows at the bottom with a Sections / Projects switch, a small search box that filters the titles live, and ← → buttons. Tapping or clicking a title hides or shows it (hidden = struck through and dimmed); drag to reorder (mouse right away; on a phone, press for a moment and drag, so the strip still scrolls with your finger) or use the keyboard: ← → arrows on the focused title, or the ← → buttons for the last one picked, announced to screen readers. Home can't be hidden or moved (`not-allowed`). Every change is saved right away to D1 (`PUT /api/sections`, admin only, checks that every key comes exactly once and `visible` is a boolean): `site_sections` (`key`, `position`, `visible`, `updated_at`) and `project_settings` (`id`, `position`, `visible`, `updated_at`). Hiding deletes nothing: a hidden section leaves the home menu, the footer and in-page links (e.g. Contact in articles and on Hire, the hire button on Contact), `sitemap.xml` and the public APIs, and its pages return 404 in Spanish and under `/en` (subpages included: `/blog/<slug>`, `/proyectos/<id>`; `/tastes` follows About). A hidden project leaves `/proyectos` and `/en/projects`, the sitemap and `/api/projects/public`, and `/proyectos/<id>` and `/en/projects/<id>` return 404. Showing it again brings it back exactly as it was. The admin with edit mode on still sees and opens hidden items, marked with a dashed outline and dimmed; with edit mode off the admin sees the site like a visitor (same rule as drafts). `src/proxy.ts` decides the 404 (`isPathHidden`) and only reads D1 on section routes. With no rows (or no tables) everything looks as always: all visible, in code order (`sections` in `src/content/site.ts`, `pastProjects` in `src/content/projects.ts`: `djtube`, `mochi`, `sami`, `punksociety`). DJTube is first and the only live one. If `project_settings` already has rows, new projects with no row go to the end: to put it first, reorder it from the admin strip. Apply migration 0008 before deploying (`pnpm db:migrate:remote`); without it the site still works with the defaults, but saving fails. |
| Referrals | `/referidos`, `/en/referrals`, `/admin/referidos` | `src/app/referidos/`, `src/components/views/referrals-view.tsx`, `src/app/admin/referidos/`, `src/components/views/referrals-admin.tsx`, `src/lib/referrals.ts`, `src/lib/referrals-db.ts`, `src/lib/referrals-api.ts`, `src/lib/viewer.ts`, `src/app/api/referrals/`, `src/app/api/admin/referrals/`, `migrations/0009_referrals.sql` | Whoever brings a client earns 15% (`REFERRAL_PCT`) of what that client pays. **Signup:** `/referidos` explains the program to anyone; signed out it shows one short line and the "Sign in with Google" button right there (lands back on `/referidos`, the `GoogleSignInButton` component in `sign-in-panel.tsx`), with the three steps below. Signed in, the signup shows: name prefilled from Google, the account's email (not editable), optional WhatsApp and a custom code (a-z, 0-9 and inner hyphens, 3 to 24, stored lowercase, live debounced check against `GET /api/referrals/check`, reserved words blocked in `RESERVED_CODES`). One code per account (`referrers.user_id` is unique). Then they see their link (`/contratar?ref=CODE` and `/en/hire?ref=CODE`) with a copy button, how many clients they brought and what's pending and collected; only their own data, looked up by the session's `user_id` on the server (`GET /api/referrals`). **Attribution:** `?ref=CODE` on any page stores the `lulox-ref` cookie for 90 days if the code exists and is active (last valid one wins; done in `src/proxy.ts`). `/contratar` and `/en/hire` show "Referido por: CODE" / "Referred by: CODE" and an editable code field (so a referrer can build the quote and pass it to the client). `/api/hire-contact` stores every send in `hire_leads` with the quote recalculated on the server and the code only if active, and adds "Referido por: code (name)" to the email. **Register:** `/admin/referidos` (admin only; 404 for anyone else, decided by `src/proxy.ts` and re-checked by the page) lists referrers with contact, code, date, email and `wa.me` buttons, and their clients; for each one you enter what the client paid (ARS or USD) and the server computes the 15% (`referral_payouts`), with pending or paid status and date. Above each referrer, what you owe per currency. Deactivating a referrer deletes nothing: the code just stops attributing. The admin can also create his own code on `/referidos`. The section hides from the admin strip like the others (404, out of the menu and the sitemap). On the home page the Referrals button only shows when signed in. Apply migration 0009 before deploying (`pnpm db:migrate:remote`). |
| Contacto | `/contacto` | `src/app/contacto/page.tsx` | Shows `contactSocials` from `site.ts` and the hire button. |
| Contratar | `/contratar` | `src/components/hire-calculator.tsx`, `src/lib/pricing.ts` | Default prices, presets, discounts and limits are in `PRICING` (`pricing.ts`, covered by `tests/pricing.test.mts`); the amounts can be changed from the page (see "Hire amounts"). Every text with an amount ("+US$ X", rates, "Deposit (X%)", the deposit note and the formula with the discounts) comes from the stored amounts. "Write me" form: fields with `id`/`name`/`autocomplete` (`hire-name`, `hire-email`, `hire-message`), message up to 280 characters counted by code point (an emoji counts 1; enforced in JS by `clampMessage` in `src/lib/hire-limits.ts`, the server validates the same way). Urgency: in hourly mode it is a flat +US$ 100 toggle (hourly work is estimated as one day, no day picker; the server forces 1 day and the email says "Urgencia: sí"); in project mode it is charged per day. Private use: optional "Private use" toggle in both modes (`PRICING.privateUse`: +US$ 500 per project, +US$ 200 per hour), with its own line in the summary, no size discount, added to the total and the deposit. By default (off) Luciano can show the work in his portfolio and the code stays open source; on, it is just for the client. The server gets it as `budget.privateUse` (strict boolean: missing means `false`, so old quotes keep working; any other value is `invalid_budget`), recalculates it, puts it in the email ("Uso privado: sí/no" and the "Uso privado" line with its amount) and stores it inside `hire_leads.budget_json` (no migration). The 15% referral cut comes from the total, private use included. Hours: slider plus a synced number box (whole numbers only, `clampHours` in `pricing.ts`: 1 to 6 per hour, 8 to 40 per project; the server clamps the same way). Per project: under 8 h is hourly work and over 40 h is negotiated (the calculator says so). Sizes: Small 20 h, Medium 30 h, Large 40 h (the buttons set those hours). Size discount on hours × rate: 8–19 h none, 20–29 h 15% (Small), 30–39 h 20% (Medium), 40 h 25% (Large). Going over or hitting the cap opens a modal (`src/components/limit-modal.tsx`): crimson card, rotating CTA-rainbow border, just the title "280 characters max" and a countdown ring; it never closes by itself: for the first 5 s it can't be closed (Esc, tapping outside and the button do nothing; the button shows the count and focus is trapped on the dialog), then "Got it" enables and it closes with the button, Esc or a tap outside, returning focus to the message; pasting again resets the count to 5; centered with `visualViewport` (works with the keyboard open). The summary that gets sent starts with the total, `hire_hp` honeypot, Turnstile and rate limit. It also accepts a plain form POST (no fetch) at `/api/hire-contact`. For AI agents, `public/llms.txt` explains how to use it (if you fork, change the domain and the booking link). |
| Hire amounts (admin) | `/contratar`, `/en/hire`, `PUT /api/pricing` | `src/components/pricing-admin.tsx`, `src/lib/pricing-settings.ts`, `src/lib/pricing-db.ts`, `src/lib/pricing-api.ts`, `src/app/api/pricing/route.ts`, `src/app/contratar/page.tsx`, `migrations/0010_pricing_settings.sql` | Signed in as admin with edit mode on, a compact "Amounts · only you" panel (collapsed by default) shows above the calculator to change, without touching code: hourly rate (low, medium, high), on-site, travel and urgency per day, private use (per project and per hour), deposit % and size discount (Small 20 h, Medium 30 h, Large 40 h). "Save" validates like the server and the calculator updates right away; "Default values" reloads the `PRICING` numbers (you still have to save). Stored in D1 `pricing_settings` (key/value, only `INSERT ... ON CONFLICT DO UPDATE`, never deleted). With no rows or no table everything stays as `PRICING`; a missing or invalid stored value falls back to that field's default (and if the three discounts end up incoherent, all three do). Strict validation (`validatePricingPayload`): every key, whole numbers (no strings), rates 0 to 1000, on-site/travel/urgency 0 to 10000, private use 0 to 100000, deposit 0 to 100 %, discounts 0 to 90 % and non-decreasing (Small ≤ Medium ≤ Large). The API answers 401 without a session, 403 if you are not admin (`ADMIN_EMAILS`) or edit mode is off (`lulox-edit-mode=off` cookie). `/contratar` renders per request (`force-dynamic`, no cache) and reads the amounts from D1, so a save shows on the next load; `/api/hire-contact` reads the same amounts for the email and `hire_leads` and never uses numbers from the browser. Min/max hours, sizes and day caps stay in code. `public/llms.txt` doesn't mention amounts, so it stays static. Visitors: nothing new. Apply migration 0010 before deploying (`pnpm db:migrate:remote`). |
| Contact form email | `/api/hire-contact` | `src/lib/hire-contact.ts`, `src/app/api/hire-contact/route.ts` | Validates (280 chars, email), honeypot, rate limit (`CONTACT_RL`), recalculates the quote on the server (private use included, `privateUse` inside `budget_json`), stores the send in D1 (`hire_leads`, with the referral code if valid and active) and emails `CONTACT_TO` (hola@lulox.com.ar, a Zoho mailbox per the MX records) with the visitor as reply-to. It goes out through Resend; the Email Routing `send_email` binding is only a fallback and can only deliver to its verified address. |
| Texts and i18n | everywhere | `src/i18n/messages.ts`, `src/i18n/locale-provider.tsx`, `src/lib/routes.ts` | Every UI string in `es` and `en`. The language comes from the URL (root = Spanish, `/en` = English; see "Two-language URLs"). |
| Themes | everywhere | `src/components/providers/theme-provider.tsx`, `src/app/globals.css` | Dark/light via the `.dark` class. The header shows dark first, then light (like 🇦🇷 → 🇺🇸), with the active one highlighted. With no saved preference it follows the system (`prefers-color-scheme`): the inline `<head>` script (`PREFS_HEAD_SCRIPT` in `src/lib/prefs-shared.ts`) applies it before first render, no flash, and it updates live if the system changes while the page is open. A theme picked by hand is saved in the `lulox-theme` cookie and beats the system. Colors are CSS variables at the top of `globals.css`. |
| Footer | `/` | `src/app/page.tsx` (`home-steal`) | The "Steal this portfolio!" / "¡Robate este portfolio!" link (`ui.stealPortfolio` in `src/i18n/messages.ts`). Point it at your fork or remove it. |

### 🖱️ Cursor convention

Everything clickable shows `cursor: pointer` and anything disabled shows `cursor: not-allowed`. A global rule at the end of `src/app/globals.css` handles it (links, buttons, clickable ARIA roles, `label[for]`, `select`, `summary`, range/checkbox/radio/submit/file/color inputs and their thumbs), so new components need nothing extra. Intentional exceptions: `.sec-reorder-handle` (`grab`), admin strip titles show `grabbing` while dragged, `.avatar-hud` (double-click easter egg) and `.md-acc-btn-edit` (editable container). To check it: with `pnpm dev` running, `pnpm audit:cursor` walks every route in Spanish and under `/en` (home, blog and articles, hire, about, projects, contact, tastes, rothko, privacy, sign-in, 404) in light/dark with headless Chrome and fails if anything clickable has the wrong cursor (`AUDIT_URL`, `AUDIT_ROUTES`, `AUDIT_WAIT=load` to target another site). To walk it as admin, pass a local session with `AUDIT_COOKIE="better-auth.session_token=..."` (only against your local preview). Typing fields (text, number, search, date) keep the text cursor.

## 🗂️ Project structure

```
├── src/
│   ├── app/            # routes (pages + api/), globals.css
│   ├── components/     # UI pieces (calculator, editor, nav, icons...)
│   ├── content/        # site.ts, projects.ts, blog seed
│   ├── i18n/           # messages.ts (ES/EN), locale provider
│   └── lib/            # pricing, blog, auth, db, contact form logic
├── migrations/         # D1 SQL migrations
├── scripts/            # seed and maintenance scripts (scripts/sql: manual SQL, not migrations)
├── tests/              # unit tests (pnpm test)
├── public/             # images, audio
├── worker.ts           # Worker entry (www → apex redirect, then OpenNext)
└── wrangler.jsonc      # Cloudflare config: D1, R2, email, rate limit, vars
```

## 🦝 Who's behind this

I'm **Luciano Oliva Bianco**, but folks call me **Lulox** (Lulo as a kid, the X came later, courtesy of Carlitox's laugh). I research, build, create, from La Boca, Buenos Aires.

- 🎬 **FEDUN** (2015 - 2020): community manager, filming classes, marketing and web development.
- 🛠️ **BuidlGuidl** (2023 - 2024): fullstack Web3 developer, building dApps with Scaffold-ETH 2 and Solidity as public goods.
- 🔬 **Input Output Global** (Jul 2025 - Oct 2026): research and development on blockchain, finance and AI, plus automations, agents and web apps. Co-authored papers on tokenization and the legal context of agentic commerce.

I mined Bitcoin around 2009 and lost the seed phrase, so trust me on the "keep your secrets out of git" part. 😅

### 💼 Hire me

Like the site? I build things like this, plus automations, AI agents and blockchain apps.
Get a quote in seconds at **[lulox.com.ar/contratar](https://lulox.com.ar/contratar)**: US$ 10 - 25/h depending on complexity, volume discounts on bigger projects, on-site work available. 50% upfront, 50% on delivery. ☕ Coffee and a good conversation included.

## 🤝 Contributing

Issues and PRs are welcome. Keep it simple:
1. `pnpm test && pnpm typecheck` before pushing.
2. One change per PR, with a clear description.
3. If you add or change a feature, update both READMEs (`README.md` in Spanish and `README.en.md` in English).
4. Copy style: no em dashes in anything a visitor reads (see `AGENTS.md`).

## 📄 License

The **code** is licensed under the [GNU AGPL-3.0-or-later](LICENSE). If you run a modified version on a server, you must share its source with its users.

The **personal content is not** part of that license: Luciano's photos, texts, blog posts, project data, audio and the organization logos (`public/orgs/`). They're his (or their owners'). Replace them with your own. Fonts come from Google Fonts under their own (OFL) licenses.
