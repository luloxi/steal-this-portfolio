"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEditMode } from "@/components/admin-context";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";
import type { Palette, SocialLink } from "@/lib/site-settings";

const COLOR_FIELDS: (keyof Palette)[] = [
  "background", "foreground", "muted", "accent", "accent2",
  "sectionAbout", "sectionProjects", "sectionBlog", "sectionTastes", "sectionContact", "sectionHire", "sectionReferrals",
];

function socialsText(list: SocialLink[]): string {
  return list.map((s) => `${s.label} | ${s.href}`).join("\n");
}

/** "Label | https://..." lines. Ids stay stable when the label still maps to the old id. */
function parseSocialLines(text: string, previous: SocialLink[]): { ok: true; json: string } | { ok: false } {
  const byLabel = new Map(previous.map((s) => [s.label.toLowerCase(), s.id]));
  const rows = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: SocialLink[] = [];
  const ids = new Set<string>();
  for (const line of rows) {
    const cut = line.indexOf("|");
    if (cut < 1) return { ok: false };
    const label = line.slice(0, cut).trim().replace(/\s+/g, " ");
    const href = line.slice(cut + 1).trim();
    if (!label || !href) return { ok: false };
    let id = byLabel.get(label.toLowerCase()) ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
    if (!id) id = "link";
    let n = id;
    let i = 2;
    while (ids.has(n)) n = `${id.slice(0, 20)}-${i++}`;
    ids.add(n);
    out.push({ id: n, label, href });
  }
  return { ok: true, json: JSON.stringify(out) };
}

/**
 * Edit mode: name, links and the main colors. Saves known site_settings keys.
 * Reset writes the neutral defaults (an update, never a delete).
 */
export function SiteSettingsEditor() {
  const editOn = useEditMode();
  const settings = useSiteSettings();
  const { locale } = useLocale();
  const es = locale !== "en";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(settings.name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [legal, setLegal] = useState(settings.legalName);
  const [descEs, setDescEs] = useState(settings.descriptionEs);
  const [descEn, setDescEn] = useState(settings.descriptionEn);
  const [ens, setEns] = useState(settings.ens);
  const [url, setUrl] = useState(settings.url);
  const [xHandle, setXHandle] = useState(settings.xHandle);
  const [avatar, setAvatar] = useState(settings.avatar);
  const [hero, setHero] = useState(settings.heroPhoto);
  const [og, setOg] = useState(settings.ogImage);
  const [githubHref, setGithubHref] = useState(settings.githubHref);
  const [githubHandle, setGithubHandle] = useState(settings.githubHandle);
  const [booking, setBooking] = useState(settings.callBookingUrl);
  const [email, setEmail] = useState(settings.contactEmail);
  const [letterboxd, setLetterboxd] = useState(settings.tasteLetterboxd);
  const [lastfm, setLastfm] = useState(settings.tasteLastfm);
  const [spotify, setSpotify] = useState(settings.tasteSpotify);
  const [socials, setSocials] = useState(socialsText(settings.socials));
  const [dark, setDark] = useState<Palette>({ ...settings.colors.dark });
  const [light, setLight] = useState<Palette>({ ...settings.colors.light });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!editOn) return null;

  const save = async () => {
    const parsed = parseSocialLines(socials, settings.socials);
    if (!parsed.ok) {
      setMsg(es ? "Cada red es «Nombre | https://…»." : "Each social is \"Name | https://…\".");
      return;
    }
    const values: Record<string, string> = {
      name, tagline, legal_name: legal, description_es: descEs, description_en: descEn,
      ens, url, x_handle: xHandle, avatar, hero_photo: hero, og_image: og,
      github_href: githubHref, github_handle: githubHandle, call_booking_url: booking,
      contact_email: email, taste_letterboxd: letterboxd, taste_lastfm: lastfm, taste_spotify: spotify,
      socials: parsed.json,
      theme_color_dark: dark.background, theme_color_light: light.background,
    };
    for (const key of COLOR_FIELDS) {
      values[`color.dark.${key}`] = dark[key];
      values[`color.light.${key}`] = light[key];
      values[`color.root.${key}`] = dark[key];
    }
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
      setMsg([data.error, data.field].filter(Boolean).join(" ") || String(res.status));
      return;
    }
    router.refresh();
    setMsg(es ? "Guardado." : "Saved.");
  };

  const field = (label: string, value: string, set: (v: string) => void, placeholder = "") => (
    <label className="pub-field">
      <span>{label}</span>
      <input className="ie-field" value={value} placeholder={placeholder} aria-label={label} onChange={(e) => set(e.target.value)} />
    </label>
  );

  return (
    <details className="site-editor" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>{es ? "Sitio" : "Site"}</summary>
      <div className="site-editor-body">
        <p className="cp-prose text-muted">
          {es ? "Nombre, links y colores. Se guardan en la base, no en el código." : "Name, links and colors. Stored in the database, not in the code."}
        </p>
        {field(es ? "Nombre" : "Name", name, setName)}
        {field("Tagline", tagline, setTagline)}
        {field(es ? "Nombre legal" : "Legal name", legal, setLegal)}
        <label className="pub-field"><span>{es ? "Descripción (ES)" : "Description (ES)"}</span><textarea className="ie-field" rows={2} value={descEs} aria-label="description es" onChange={(e) => setDescEs(e.target.value)} /></label>
        <label className="pub-field"><span>{es ? "Descripción (EN)" : "Description (EN)"}</span><textarea className="ie-field" rows={2} value={descEn} aria-label="description en" onChange={(e) => setDescEn(e.target.value)} /></label>
        {field("ENS", ens, setEns)}
        {field("URL", url, setUrl, "https://")}
        {field("X", xHandle, setXHandle, "@")}
        {field(es ? "Avatar" : "Avatar", avatar, setAvatar)}
        {field(es ? "Foto" : "Hero", hero, setHero)}
        {field("OG", og, setOg)}
        {field("GitHub", githubHref, setGithubHref, "https://")}
        {field(es ? "GitHub (texto)" : "GitHub label", githubHandle, setGithubHandle)}
        {field(es ? "Reservar llamada" : "Book a call", booking, setBooking)}
        {field("Email", email, setEmail)}
        {field("Letterboxd", letterboxd, setLetterboxd)}
        {field("Last.fm", lastfm, setLastfm)}
        {field("Spotify", spotify, setSpotify)}
        <label className="pub-field">
          <span>{es ? "Redes (Nombre | https://…)" : "Socials (Name | https://…)"}</span>
          <textarea className="ie-field" rows={4} value={socials} aria-label="socials" onChange={(e) => setSocials(e.target.value)} />
        </label>
        <p className="cp-prose">{es ? "Oscuro" : "Dark"}</p>
        {COLOR_FIELDS.map((key) => field(key, dark[key], (v) => setDark({ ...dark, [key]: v })))}
        <p className="cp-prose">{es ? "Claro" : "Light"}</p>
        {COLOR_FIELDS.map((key) => field(`${key} light`, light[key], (v) => setLight({ ...light, [key]: v })))}
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="pub-btn is-primary" disabled={busy} onClick={() => void save()}>
            {busy ? "…" : (es ? "Guardar sitio" : "Save site")}
          </button>
          {msg ? <span role="alert">{msg}</span> : null}
        </div>
      </div>
    </details>
  );
}
