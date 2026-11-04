/**
 * Site identity, socials and theme colors. Stored in D1 `site_settings`
 * (migrations/0013_site_settings.sql) as key/value. Missing or invalid values
 * fall back to the neutral defaults below, so a fresh database is a generic
 * portfolio, not anyone's personal site.
 */
export type SocialLink = { id: string; label: string; href: string };

export type Palette = {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  accent: string;
  accent2: string;
  surface: string;
  neonCrimson: string;
  neonOrange: string;
  glowCrimson: string;
  glowOrange: string;
  emailBg: string;
  emailBorder: string;
  emailFg: string;
  emailBtnBg: string;
  sectionAbout: string;
  sectionProjects: string;
  sectionBlog: string;
  sectionTastes: string;
  sectionContact: string;
  sectionHire: string;
  sectionReferrals: string;
};

export type SiteSettings = {
  name: string;
  tagline: string;
  legalName: string;
  descriptionEs: string;
  descriptionEn: string;
  ens: string;
  avatar: string;
  heroPhoto: string;
  ogImage: string;
  url: string;
  xHandle: string;
  keywords: string[];
  contactEmail: string;
  githubHref: string;
  githubHandle: string;
  callBookingUrl: string;
  socials: SocialLink[];
  tasteLetterboxd: string;
  tasteLastfm: string;
  tasteSpotify: string;
  themeColorDark: string;
  themeColorLight: string;
  colors: { root: Palette; light: Palette; dark: Palette };
};

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const MIX = /^color-mix\(in oklab, #[0-9a-fA-F]{3,8} \d{1,3}%, (?:transparent|#[0-9a-fA-F]{3,8})\)$/;

export function isCssColor(value: string): boolean {
  return HEX.test(value) || MIX.test(value);
}

const DARK: Palette = {
  // Paleta lulox 2026-11-04 (neón): magenta / cian / lima / violeta sobre casi negro.
  background: "#0b0b12",
  foreground: "#f2f1f7",
  muted: "#9a98ae",
  border: "#26263a",
  accent: "#ff4fd8",
  accent2: "#00e5ff",
  surface: "#15151f",
  neonCrimson: "#ff4fd8",
  neonOrange: "#7c5cff",
  glowCrimson: "color-mix(in oklab, #ff4fd8 45%, transparent)",
  glowOrange: "color-mix(in oklab, #7c5cff 35%, transparent)",
  emailBg: "color-mix(in oklab, #00e5ff 14%, transparent)",
  emailBorder: "color-mix(in oklab, #00e5ff 50%, transparent)",
  emailFg: "#00e5ff",
  emailBtnBg: "color-mix(in oklab, #00e5ff 24%, transparent)",
  sectionAbout: "#7c5cff",
  sectionProjects: "#00e5ff",
  sectionBlog: "#ffe14d",
  sectionTastes: "#9a98ae",
  sectionContact: "#39ff88",
  sectionHire: "#ff4fd8",
  sectionReferrals: "#b6ff3b",
};

const LIGHT: Palette = {
  // Paleta lulox 2026-11-04 (pastel). accent/accent2 son la versión "tinta" del durazno y la lavanda
  // porque se usan como color de texto (AA); los pastel puros van en rellenos, bordes e íconos.
  // Las section* son tintas más hondas de cada pastel: se usan como color de título (AA texto grande).
  background: "#fbf8f4",
  foreground: "#2b2a33",
  muted: "#6e6b7b",
  border: "#ece6ef",
  accent: "#a4503f",
  accent2: "#5a47ad",
  surface: "#ffffff",
  neonCrimson: "#f4a99b",
  neonOrange: "#b8a9f0",
  glowCrimson: "color-mix(in oklab, #f4a99b 30%, transparent)",
  glowOrange: "color-mix(in oklab, #b8a9f0 25%, transparent)",
  emailBg: "color-mix(in oklab, #b8a9f0 22%, #ffffff)",
  emailBorder: "color-mix(in oklab, #b8a9f0 70%, #ffffff)",
  emailFg: "#4a3d94",
  emailBtnBg: "color-mix(in oklab, #b8a9f0 40%, #ffffff)",
  sectionAbout: "#6b5bc4",
  sectionProjects: "#b0563f",
  sectionBlog: "#2f6f9e",
  sectionTastes: "#b04a58",
  sectionContact: "#2f7d4f",
  sectionHire: "#a4503f",
  sectionReferrals: "#2c7a6c",
};

export const DEFAULT_SITE: SiteSettings = {
  name: "Portfolio",
  tagline: "A personal site",
  legalName: "Site owner",
  descriptionEs: "Portfolio personal. El nombre, los textos y los colores se cambian desde el modo edición.",
  descriptionEn: "A personal portfolio. Name, copy and colors are changed from edit mode.",
  ens: "",
  avatar: "/avatar.svg",
  heroPhoto: "/avatar.svg",
  ogImage: "/avatar.svg",
  url: "https://example.com",
  xHandle: "",
  keywords: ["portfolio"],
  contactEmail: "",
  githubHref: "",
  githubHandle: "",
  callBookingUrl: "",
  socials: [],
  tasteLetterboxd: "",
  tasteLastfm: "",
  tasteSpotify: "",
  themeColorDark: "#0b0b12",
  themeColorLight: "#fbf8f4",
  colors: { root: { ...DARK }, light: { ...LIGHT }, dark: { ...DARK } },
};

export const PALETTE_KEYS = Object.keys(DARK) as (keyof Palette)[];

const CSS_PROP: Record<keyof Palette, string> = {
  background: "--background",
  foreground: "--foreground",
  muted: "--muted",
  border: "--border",
  accent: "--accent",
  accent2: "--accent-2",
  surface: "--surface",
  neonCrimson: "--neon-crimson",
  neonOrange: "--neon-orange",
  glowCrimson: "--glow-crimson",
  glowOrange: "--glow-orange",
  emailBg: "--email-bg",
  emailBorder: "--email-border",
  emailFg: "--email-fg",
  emailBtnBg: "--email-btn-bg",
  sectionAbout: "--section-about",
  sectionProjects: "--section-projects",
  sectionBlog: "--section-blog",
  sectionTastes: "--section-tastes",
  sectionContact: "--section-contact",
  sectionHire: "--section-hire",
  sectionReferrals: "--section-referrals",
};

const SCOPES = ["root", "light", "dark"] as const;
export type ColorScope = (typeof SCOPES)[number];

/** D1 key for a palette slot, e.g. color.dark.accent */
export function colorKey(scope: ColorScope, name: keyof Palette): string {
  return `color.${scope}.${name}`;
}

const TEXT_KEYS = [
  "name", "tagline", "legal_name", "description_es", "description_en", "ens",
  "avatar", "hero_photo", "og_image", "url", "x_handle", "keywords", "contact_email",
  "github_href", "github_handle", "call_booking_url", "socials",
  "taste_letterboxd", "taste_lastfm", "taste_spotify", "theme_color_dark", "theme_color_light",
] as const;

export const SETTING_KEYS = new Set<string>([
  ...TEXT_KEYS,
  ...SCOPES.flatMap((scope) => PALETTE_KEYS.map((name) => colorKey(scope, name))),
]);

const LIMITS: Record<string, number> = {
  name: 40,
  tagline: 80,
  legal_name: 80,
  description_es: 300,
  description_en: 300,
  ens: 80,
  avatar: 300,
  hero_photo: 300,
  og_image: 300,
  url: 200,
  x_handle: 40,
  keywords: 300,
  contact_email: 254,
  github_href: 300,
  github_handle: 80,
  call_booking_url: 600,
  socials: 4000,
  taste_letterboxd: 300,
  taste_lastfm: 300,
  taste_spotify: 300,
  theme_color_dark: 9,
  theme_color_light: 9,
};

function cleanLine(raw: string, max: number): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (t.length > max || /[\u0000-\u001f\u007f]/.test(t)) return null;
  return t;
}

function cleanHttps(raw: string, max: number): string | null {
  const t = raw.trim();
  if (!t) return "";
  if (t.length > max || /\s/.test(t)) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:" || !u.hostname || u.username || u.password) return null;
  } catch {
    return null;
  }
  return t;
}

function cleanPathOrHttps(raw: string, max: number): string | null {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("/") && !t.startsWith("//") && !t.includes("..") && t.length <= max && !/\s/.test(t)) return t;
  return cleanHttps(t, max);
}

const SOCIAL_ID = /^[a-z0-9](?:[a-z0-9-]{0,22}[a-z0-9])?$/;

export function parseSocials(raw: string): SocialLink[] | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(data) || data.length > 12) return null;
  const out: SocialLink[] = [];
  const ids = new Set<string>();
  for (const item of data) {
    if (!item || typeof item !== "object") return null;
    const id = String((item as { id?: unknown }).id ?? "").trim();
    const label = cleanLine(String((item as { label?: unknown }).label ?? ""), 40);
    const href = cleanHttps(String((item as { href?: unknown }).href ?? ""), 300);
    if (!SOCIAL_ID.test(id) || ids.has(id) || !label || href === null || !href) return null;
    ids.add(id);
    out.push({ id, label, href });
  }
  return out;
}

function applyText(base: SiteSettings, key: string, value: string): void {
  const set = (ok: string | null, write: (v: string) => void) => {
    if (ok !== null) write(ok);
  };
  switch (key) {
    case "name":
      set(cleanLine(value, LIMITS.name), (v) => { if (v) base.name = v; });
      break;
    case "tagline":
      set(cleanLine(value, LIMITS.tagline), (v) => { base.tagline = v; });
      break;
    case "legal_name":
      set(cleanLine(value, LIMITS.legal_name), (v) => { if (v) base.legalName = v; });
      break;
    case "description_es":
      set(cleanLine(value, LIMITS.description_es), (v) => { if (v) base.descriptionEs = v; });
      break;
    case "description_en":
      set(cleanLine(value, LIMITS.description_en), (v) => { if (v) base.descriptionEn = v; });
      break;
    case "ens":
      set(cleanLine(value, LIMITS.ens), (v) => { base.ens = v; });
      break;
    case "avatar":
      set(cleanPathOrHttps(value, LIMITS.avatar), (v) => { if (v) base.avatar = v; });
      break;
    case "hero_photo":
      set(cleanPathOrHttps(value, LIMITS.hero_photo), (v) => { if (v) base.heroPhoto = v; });
      break;
    case "og_image":
      set(cleanPathOrHttps(value, LIMITS.og_image), (v) => { if (v) base.ogImage = v; });
      break;
    case "url": {
      const v = cleanHttps(value, LIMITS.url);
      if (v) base.url = v.replace(/\/$/, "");
      break;
    }
    case "x_handle":
      set(cleanLine(value, LIMITS.x_handle), (v) => { base.xHandle = v; });
      break;
    case "keywords": {
      const v = cleanLine(value, LIMITS.keywords);
      if (v) base.keywords = v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
      break;
    }
    case "contact_email":
      set(cleanLine(value, LIMITS.contact_email), (v) => { base.contactEmail = v; });
      break;
    case "github_href":
      set(cleanHttps(value, LIMITS.github_href), (v) => { base.githubHref = v; });
      break;
    case "github_handle":
      set(cleanLine(value, LIMITS.github_handle), (v) => { base.githubHandle = v; });
      break;
    case "call_booking_url":
      set(cleanHttps(value, LIMITS.call_booking_url), (v) => { base.callBookingUrl = v; });
      break;
    case "socials": {
      const v = parseSocials(value);
      if (v) base.socials = v;
      break;
    }
    case "taste_letterboxd":
      set(cleanHttps(value, LIMITS.taste_letterboxd), (v) => { base.tasteLetterboxd = v; });
      break;
    case "taste_lastfm":
      set(cleanHttps(value, LIMITS.taste_lastfm), (v) => { base.tasteLastfm = v; });
      break;
    case "taste_spotify":
      set(cleanHttps(value, LIMITS.taste_spotify), (v) => { base.tasteSpotify = v; });
      break;
    case "theme_color_dark":
      if (HEX.test(value.trim())) base.themeColorDark = value.trim();
      break;
    case "theme_color_light":
      if (HEX.test(value.trim())) base.themeColorLight = value.trim();
      break;
    default:
      break;
  }
}

export function settingsFromRows(rows: readonly { key: unknown; value: unknown }[] | null | undefined): SiteSettings {
  const base: SiteSettings = {
    ...DEFAULT_SITE,
    keywords: [...DEFAULT_SITE.keywords],
    socials: [],
    colors: {
      root: { ...DEFAULT_SITE.colors.root },
      light: { ...DEFAULT_SITE.colors.light },
      dark: { ...DEFAULT_SITE.colors.dark },
    },
  };
  for (const row of rows ?? []) {
    if (typeof row?.key !== "string" || typeof row.value !== "string") continue;
    if (!SETTING_KEYS.has(row.key)) continue;
    const color = /^color\.(root|light|dark)\.([A-Za-z0-9]+)$/.exec(row.key);
    if (color) {
      const scope = color[1] as ColorScope;
      const name = color[2] as keyof Palette;
      if (!(name in base.colors[scope])) continue;
      const value = row.value.trim();
      if (isCssColor(value)) base.colors[scope][name] = value;
      continue;
    }
    applyText(base, row.key, row.value);
  }
  return base;
}

function paletteBlock(selector: string, palette: Palette): string {
  const body = PALETTE_KEYS.map((k) => `${CSS_PROP[k]}:${palette[k]}`).join(";");
  return `${selector}{${body}}`;
}

/** CSS that overrides the neutral tokens in globals.css. Safe: every value passed isCssColor. */
export function themeCss(settings: SiteSettings): string {
  return [
    paletteBlock(":root", settings.colors.root),
    paletteBlock(":root:not(.dark)", settings.colors.light),
    paletteBlock(".dark", settings.colors.dark),
  ].join("");
}

export type SettingsValidation =
  | { ok: true; entries: { key: string; value: string }[] }
  | { ok: false; error: string; field?: string };

/**
 * Admin save: { values: { name: "...", ... } }. Only known keys. Each value is
 * checked the same way a stored row is. Unknown keys are rejected.
 */
export function validateSettingsPayload(body: unknown): SettingsValidation {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_body" };
  const raw = (body as { values?: unknown }).values;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "invalid_body" };
  const obj = raw as Record<string, unknown>;
  const entries: { key: string; value: string }[] = [];
  for (const key of Object.keys(obj)) {
    if (!SETTING_KEYS.has(key)) return { ok: false, error: "unknown_field", field: key };
    if (typeof obj[key] !== "string") return { ok: false, error: "invalid_value", field: key };
    const value = obj[key] as string;
    const before = settingsFromRows([]);
    const after = settingsFromRows([{ key, value }]);
    const color = /^color\.(root|light|dark)\.([A-Za-z0-9]+)$/.exec(key);
    if (color) {
      const scope = color[1] as ColorScope;
      const name = color[2] as keyof Palette;
      if (!isCssColor(value.trim()) || after.colors[scope][name] !== value.trim()) {
        return { ok: false, error: "invalid_value", field: key };
      }
    } else if (JSON.stringify(snapshot(before)) === JSON.stringify(snapshot(after)) && value.trim() !== "" && key !== "socials") {
      // Empty string clears optional fields (ens, github, tastes). A non-empty
      // value that didn't change the snapshot was rejected by the cleaner.
      // But a valid value can also equal the neutral default (no visible change): probe with
      // a longer value, which the same cleaner accepts only if this key takes the value at all.
      const probes = [`${value}x`, `${value}\u200b`];
      const accepted = probes.some((p) => JSON.stringify(snapshot(settingsFromRows([{ key, value: p }]))) !== JSON.stringify(snapshot(before)));
      if (!accepted) return { ok: false, error: "invalid_value", field: key };
    }
    entries.push({ key, value: color ? value.trim() : value });
  }
  if (entries.length === 0) return { ok: false, error: "invalid_body" };
  return { ok: true, entries };
}

function snapshot(s: SiteSettings) {
  const { colors: _c, ...rest } = s;
  return rest;
}

export function descriptionFor(settings: SiteSettings, locale: "es" | "en"): string {
  return locale === "en" ? settings.descriptionEn : settings.descriptionEs;
}
