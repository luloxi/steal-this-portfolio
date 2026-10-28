"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useEditModeSwitch } from "@/components/admin-context";
import { Tip } from "@/components/tip";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";
import type { Palette, SocialLink } from "@/lib/site-settings";
import { pickImageFile, uploadMedia } from "@/lib/upload-media";

export type SettingsTab = "appearance" | "info";

type ColorField = { key: keyof Palette; es: string; en: string; tipEs: string; tipEn: string };

const COLOR_FIELDS: ColorField[] = [
  { key: "background", es: "Fondo", en: "Background", tipEs: "Color de fondo de todo el sitio", tipEn: "Background color of the whole site" },
  { key: "foreground", es: "Texto", en: "Text", tipEs: "Color del texto principal", tipEn: "Main text color" },
  { key: "muted", es: "Texto suave", en: "Soft text", tipEs: "Textos secundarios y aclaraciones", tipEn: "Secondary text and captions" },
  { key: "accent", es: "Acento", en: "Accent", tipEs: "Color de enlaces y detalles", tipEn: "Links and highlights" },
  { key: "accent2", es: "Acento 2", en: "Accent 2", tipEs: "Segundo color de detalles", tipEn: "Second highlight color" },
  { key: "sectionAbout", es: "Botón Sobre mí", en: "About button", tipEs: "Color del botón Sobre mí en el inicio", tipEn: "Color of the About button on the home page" },
  { key: "sectionProjects", es: "Botón Proyectos", en: "Projects button", tipEs: "Color del botón Proyectos en el inicio", tipEn: "Color of the Projects button on the home page" },
  { key: "sectionBlog", es: "Botón Blog", en: "Blog button", tipEs: "Color del botón Blog en el inicio", tipEn: "Color of the Blog button on the home page" },
  { key: "sectionTastes", es: "Botón Gustos", en: "Tastes button", tipEs: "Color del botón Gustos", tipEn: "Color of the Tastes button" },
  { key: "sectionContact", es: "Botón Contacto", en: "Contact button", tipEs: "Color del botón Contacto en el inicio", tipEn: "Color of the Contact button on the home page" },
  { key: "sectionHire", es: "Botón Contratar", en: "Hire button", tipEs: "Color del botón Contratar en el inicio", tipEn: "Color of the Hire button on the home page" },
  { key: "sectionReferrals", es: "Botón Referidos", en: "Referrals button", tipEs: "Color del botón Referidos en el inicio", tipEn: "Color of the Referrals button on the home page" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

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

/** The values the form saves, as they are now in D1 (same keys as the PUT body). */
function initialValues(s: ReturnType<typeof useSiteSettings>): Record<string, string> {
  const out: Record<string, string> = {
    name: s.name, tagline: s.tagline, legal_name: s.legalName, description_es: s.descriptionEs, description_en: s.descriptionEn,
    ens: s.ens, url: s.url, x_handle: s.xHandle, avatar: s.avatar, hero_photo: s.heroPhoto, og_image: s.ogImage,
    github_href: s.githubHref, github_handle: s.githubHandle, call_booking_url: s.callBookingUrl,
    contact_email: s.contactEmail, taste_letterboxd: s.tasteLetterboxd, taste_lastfm: s.tasteLastfm, taste_spotify: s.tasteSpotify,
    socials: JSON.stringify(s.socials.map(({ id, label, href }) => ({ id, label, href }))),
    theme_color_dark: s.colors.dark.background, theme_color_light: s.colors.light.background,
  };
  for (const { key } of COLOR_FIELDS) {
    out[`color.dark.${key}`] = s.colors.dark[key];
    out[`color.light.${key}`] = s.colors.light[key];
    out[`color.root.${key}`] = s.colors.dark[key];
  }
  return out;
}

async function putSettings(values: Record<string, string>): Promise<string | null> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
  return res.status === 401 ? "session" : ([data.error, data.field].filter(Boolean).join(" ") || String(res.status));
}

/**
 * The "Apariencia" and "Info personal" tabs of the admin panel. All the form
 * state lives here (mounted while the panel is open), so switching tabs keeps
 * unsaved edits. One Save writes the known site_settings keys to D1.
 */
export function AdminSettings({ tab }: { tab: SettingsTab | null }) {
  const settings = useSiteSettings();
  const { locale } = useLocale();
  const es = locale !== "en";
  const router = useRouter();
  const edit = useEditModeSwitch();
  const [text, setText] = useState({
    name: settings.name, tagline: settings.tagline, legal: settings.legalName,
    descEs: settings.descriptionEs, descEn: settings.descriptionEn, ens: settings.ens, url: settings.url,
    xHandle: settings.xHandle, avatar: settings.avatar, hero: settings.heroPhoto, og: settings.ogImage,
    githubHref: settings.githubHref, githubHandle: settings.githubHandle, booking: settings.callBookingUrl,
    email: settings.contactEmail, letterboxd: settings.tasteLetterboxd, lastfm: settings.tasteLastfm, spotify: settings.tasteSpotify,
    socials: socialsText(settings.socials),
  });
  const [dark, setDark] = useState<Palette>({ ...settings.colors.dark });
  const [light, setLight] = useState<Palette>({ ...settings.colors.light });
  // Last values known to be in D1 (the form starts from the server's settings).
  const saved = useRef<Record<string, string>>(initialValues(settings));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof text) => (v: string) => setText((t) => ({ ...t, [k]: v }));

  const fail = (err: string) =>
    setMsg({ ok: false, text: err === "session" ? (es ? "Sesión vencida: volvé a ingresar." : "Session expired: sign in again.") : (es ? `No se pudo guardar (${err}).` : `Could not save (${err}).`) });

  const save = async () => {
    const parsed = parseSocialLines(text.socials, settings.socials);
    if (!parsed.ok) {
      setMsg({ ok: false, text: es ? "Cada red va como «Nombre | https://…»." : "Each social is \"Name | https://…\"." });
      return;
    }
    const all: Record<string, string> = {
      name: text.name, tagline: text.tagline, legal_name: text.legal, description_es: text.descEs, description_en: text.descEn,
      ens: text.ens, url: text.url, x_handle: text.xHandle, avatar: text.avatar, hero_photo: text.hero, og_image: text.og,
      github_href: text.githubHref, github_handle: text.githubHandle, call_booking_url: text.booking,
      contact_email: text.email, taste_letterboxd: text.letterboxd, taste_lastfm: text.lastfm, taste_spotify: text.spotify,
      socials: parsed.json,
      theme_color_dark: dark.background, theme_color_light: light.background,
    };
    for (const { key } of COLOR_FIELDS) {
      all[`color.dark.${key}`] = dark[key];
      all[`color.light.${key}`] = light[key];
      all[`color.root.${key}`] = dark[key];
    }
    // Send only what changed: the server rejects a text value that equals the neutral default.
    const values = Object.fromEntries(Object.entries(all).filter(([k, v]) => saved.current[k] !== v));
    if (Object.keys(values).length === 0) {
      setMsg({ ok: true, text: es ? "No hay cambios." : "No changes." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const err = await putSettings(values);
    setBusy(false);
    if (err) return fail(err);
    saved.current = { ...saved.current, ...values };
    router.refresh();
    setMsg({ ok: true, text: es ? "Guardado." : "Saved." });
  };

  /** Upload a new landing photo and save it right away (the old one stays in R2). */
  const changeHero = async () => {
    const file = await pickImageFile();
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const up = await uploadMedia(file);
    if (!up.url) {
      setBusy(false);
      setMsg({ ok: false, text: up.error === "type" ? (es ? "Usá PNG, JPG, WebP, GIF o AVIF." : "Use PNG, JPG, WebP, GIF or AVIF.") : up.error === "size" ? (es ? "Pesa más de 8 MB." : "Over 8 MB.") : (es ? `No se pudo subir (${up.error}).` : `Upload failed (${up.error}).`) });
      return;
    }
    const err = await putSettings({ hero_photo: up.url });
    setBusy(false);
    if (err) return fail(err);
    saved.current = { ...saved.current, hero_photo: up.url };
    setText((t) => ({ ...t, hero: up.url! }));
    router.refresh();
    setMsg({ ok: true, text: es ? "Foto cambiada." : "Photo changed." });
  };

  const field = (label: string, tip: string, k: keyof typeof text, placeholder = "") => (
    <label className="adm-field" key={k}>
      <Tip text={tip}><span className="adm-label">{label}</span></Tip>
      <input className="adm-input" value={text[k]} placeholder={placeholder} aria-label={label} onChange={(e) => set(k)(e.target.value)} />
    </label>
  );
  const area = (label: string, tip: string, k: keyof typeof text, rows = 2) => (
    <label className="adm-field" key={k}>
      <Tip text={tip}><span className="adm-label">{label}</span></Tip>
      <textarea className="adm-input" rows={rows} value={text[k]} aria-label={label} onChange={(e) => set(k)(e.target.value)} />
    </label>
  );

  const palette = (title: string, value: Palette, setValue: (p: Palette) => void) => (
    <section className="adm-group" aria-label={title}>
      <h3 className="adm-h">{title}</h3>
      <div className="adm-colors">
        {COLOR_FIELDS.map((f) => {
          const label = es ? f.es : f.en;
          const v = value[f.key];
          return (
            <div className="adm-color" key={f.key}>
              <Tip text={es ? f.tipEs : f.tipEn}><span className="adm-label">{label}</span></Tip>
              <input
                type="color"
                className="adm-swatch"
                aria-label={`${label} (${title})`}
                value={HEX.test(v) ? v : "#000000"}
                onChange={(e) => setValue({ ...value, [f.key]: e.target.value })}
              />
              <input
                className="adm-input adm-hex"
                aria-label={`${label} hex (${title})`}
                value={v}
                spellCheck={false}
                onChange={(e) => setValue({ ...value, [f.key]: e.target.value })}
              />
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      {tab === "appearance" ? (
        <div className="adm-stack">
          {palette(es ? "Modo oscuro" : "Dark mode", dark, setDark)}
          {palette(es ? "Modo claro" : "Light mode", light, setLight)}
        </div>
      ) : null}
      {tab === "info" ? (
        <div className="adm-stack">
          <section className="adm-group" aria-label={es ? "Foto principal" : "Main photo"}>
            <h3 className="adm-h">{es ? "Foto principal" : "Main photo"}</h3>
            <div className="adm-photo">
              <Image src={text.hero || settings.heroPhoto} alt={es ? "Foto principal actual" : "Current main photo"} width={96} height={96} className="adm-photo-img" unoptimized />
              <div className="adm-photo-side">
                <Tip text={es ? "Sube una imagen nueva y se guarda al toque. La actual queda de respaldo." : "Upload a new image and it saves right away. The current one stays as a backup."}>
                  <button type="button" className="adm-btn" disabled={busy || !edit.on} onClick={() => void changeHero()}>
                    {es ? "Cambiar foto" : "Change photo"}
                  </button>
                </Tip>
                {field(es ? "Dirección de la foto" : "Photo address", es ? "O pegá la dirección de una imagen (empieza con / o https://)" : "Or paste an image address (starts with / or https://)", "hero", "/media/…")}
              </div>
            </div>
          </section>
          <section className="adm-group" aria-label={es ? "Identidad" : "Identity"}>
            <h3 className="adm-h">{es ? "Identidad" : "Identity"}</h3>
            {field(es ? "Nombre" : "Name", es ? "El título grande del inicio y de la pestaña del navegador" : "The big title on the home page and the browser tab", "name")}
            {field(es ? "Frase corta" : "Tagline", es ? "Una línea debajo de tu nombre" : "One line under your name", "tagline")}
            {field(es ? "Nombre legal" : "Legal name", es ? "Aparece como autor del sitio" : "Shown as the site author", "legal")}
            {area(es ? "Descripción (español)" : "Description (Spanish)", es ? "Lo que se ve al compartir el link en español" : "What shows when the link is shared in Spanish", "descEs")}
            {area(es ? "Descripción (inglés)" : "Description (English)", es ? "Lo que se ve al compartir el link en inglés" : "What shows when the link is shared in English", "descEn")}
          </section>
          <section className="adm-group" aria-label={es ? "Imágenes y dirección" : "Images and address"}>
            <h3 className="adm-h">{es ? "Imágenes y dirección" : "Images and address"}</h3>
            {field(es ? "Avatar" : "Avatar", es ? "Imagen chica del sitio (icono)" : "Small site image (icon)", "avatar")}
            {field(es ? "Imagen para compartir" : "Share image", es ? "La vista previa cuando pegás el link en redes" : "The preview when the link is pasted on social networks", "og")}
            {field(es ? "Dirección del sitio" : "Site address", es ? "La URL pública, con https://" : "The public URL, with https://", "url", "https://")}
            {field("ENS", es ? "Tu nombre ENS, si tenés" : "Your ENS name, if any", "ens")}
          </section>
          <section className="adm-group" aria-label={es ? "Links y contacto" : "Links and contact"}>
            <h3 className="adm-h">{es ? "Links y contacto" : "Links and contact"}</h3>
            {field("X", es ? "Tu usuario de X, con @" : "Your X handle, with @", "xHandle", "@")}
            {field("GitHub", es ? "Link a tu perfil de GitHub" : "Link to your GitHub profile", "githubHref", "https://")}
            {field(es ? "GitHub (texto)" : "GitHub (text)", es ? "El texto que se ve en el link de GitHub" : "The text shown on the GitHub link", "githubHandle")}
            {field(es ? "Reservar llamada" : "Book a call", es ? "Link de tu agenda. Vacío = no se muestra el botón" : "Your calendar link. Empty = the button is hidden", "booking", "https://")}
            {field("Email", es ? "Tu mail de contacto" : "Your contact email", "email")}
            {area(es ? "Redes" : "Socials", es ? "Una por línea: Nombre | https://…" : "One per line: Name | https://…", "socials", 4)}
          </section>
          <section className="adm-group" aria-label={es ? "Gustos" : "Tastes"}>
            <h3 className="adm-h">{es ? "Gustos" : "Tastes"}</h3>
            {field("Letterboxd", es ? "Tu usuario de Letterboxd" : "Your Letterboxd username", "letterboxd")}
            {field("Last.fm", es ? "Tu usuario de Last.fm" : "Your Last.fm username", "lastfm")}
            {field("Spotify", es ? "Link a tu perfil de Spotify" : "Link to your Spotify profile", "spotify")}
          </section>
        </div>
      ) : null}
      {tab ? (
        <div className="adm-foot">
          <Tip text={edit.on ? (es ? "Guardar los cambios en el sitio" : "Save the changes to the site") : (es ? "Activá «Editar textos en la página» en la pestaña Secciones para guardar" : "Turn on \"Edit text on the page\" in the Sections tab to save")}>
            <button type="button" className="adm-btn is-primary" disabled={busy || !edit.on} onClick={() => void save()}>
              {busy ? "…" : (es ? "Guardar" : "Save")}
            </button>
          </Tip>
          {msg ? <span className={`adm-msg${msg.ok ? " is-ok" : " is-bad"}`} role="status">{msg.text}</span> : null}
        </div>
      ) : null}
    </>
  );
}
