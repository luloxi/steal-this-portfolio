"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import { CpRow } from "@/components/cp-row";
import { BuidlGuidlIcon } from "@/components/icons/brands";
import {
  LastFmIcon,
  LetterboxdBrandIcon,
  LinkedInIcon,
  SpotifyIcon,
} from "@/components/icons/social";
import { PageShell } from "@/components/page-shell";
import { CopyMarkdown } from "@/components/copy-markdown";
import { CopyText } from "@/components/copy-text";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";
import { deleteSection, insertSection, splitSections } from "@/lib/md-sections";
import { insertJob, insertStory, parseLayout, recordsAfterStory, removeStory, serializeLayout, type LayoutItem } from "@/lib/page-layout";
import { Publications } from "@/components/publications";
import { DEFAULT_PUBLICATIONS, stripPublicationLinksInBody, type Publication } from "@/lib/publications";
import { saveCopy, useEditMode } from "@/components/admin-context";
import { normalizeCopyValue } from "@/lib/copy-value";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type OrgLogo =
  | { type: "icon"; Icon: ComponentType<{ className?: string }> }
  | { type: "image"; src: string; alt: string; light?: boolean };

const orgLogos: Record<string, OrgLogo> = {
  "Input Output Global": {
    type: "image",
    src: "/orgs/input-output.jpg",
    alt: "Input Output Global",
  },
  BuidlGuidl: { type: "icon", Icon: BuidlGuidlIcon },
  FEDUN: { type: "image", src: "/orgs/fedun.png", alt: "FEDUN", light: true },
};

const timelineAccents = [
  "var(--section-about)",
  "var(--section-projects)",
];

const platforms = [
  {
    id: "letterboxd" as const,
    label: "Letterboxd",
    Icon: LetterboxdBrandIcon,
    iconClass: undefined as string | undefined,
    accent: "#ff8000",
  },
  {
    id: "lastfm" as const,
    label: "Last.fm",
    Icon: LastFmIcon,
    iconClass: "text-[#D51007]",
    accent: "#D51007",
  },
  {
    id: "spotify" as const,
    label: "Spotify",
    Icon: SpotifyIcon,
    iconClass: "text-[#1DB954]",
    accent: "#1DB954",
  },
];

/**
 * Sobre mí (/sobre-mi, /en/about). `publications` comes from the server
 * (D1 over the code defaults); hidden ones only reach the admin in edit mode.
 */
/** accent: optional CSS color for the card ("" = theme palette). hidden "1" is removed from the page. */
type Job = { period: string; title: string; org: string; description: string; accent?: string; hidden?: string };

function stored(value: string): string {
  const n = normalizeCopyValue(value);
  return n.ok ? n.value : value;
}

function jobSig(jobs: readonly Job[]): string {
  return JSON.stringify(jobs.map((j) => [j.period, j.title, j.org, j.description, j.accent ?? "", j.hidden ?? ""]));
}

export function AboutView({ publications }: { publications: readonly Publication[] }) {
  const { t, locale } = useLocale();
  const settings = useSiteSettings();
  const editOn = useEditMode();
  const router = useRouter();
  const linkedInHref = settings.socials.find((s) => s.id === "linkedin")?.href ?? "";
  const tasteHref = {
    letterboxd: settings.tasteLetterboxd,
    lastfm: settings.tasteLastfm,
    spotify: settings.tasteSpotify,
  };
  const about = t.about;
  // Local copies so a new story or job shows before the server render comes back,
  // and a delete disappears even if that render is still the previous page.
  const [body, setBody] = useState<string>(about.body);
  const [layoutRaw, setLayoutRaw] = useState<string>(about.layout);
  const [timeline, setTimeline] = useState<Job[]>(() => about.timeline.map((j) => ({ ...j })));
  const [reveal, setReveal] = useState<{ id: number; index: number } | null>(null);
  const written = useRef<{ body: string; layout: string } | null>(null);
  const jobsWritten = useRef<string | null>(null);
  const revealSeq = useRef(0);
  const bodyRef = useRef(body);
  const layoutRef = useRef(layoutRaw);
  const timelineRef = useRef(timeline);
  useEffect(() => {
    const w = written.current;
    if (w && (about.body !== w.body || about.layout !== w.layout)) return;
    written.current = null;
    bodyRef.current = about.body;
    layoutRef.current = about.layout;
    setBody(about.body);
    setLayoutRaw(about.layout);
  }, [about.body, about.layout]);
  useEffect(() => {
    const sig = jobSig(about.timeline);
    if (jobsWritten.current && jobsWritten.current !== sig) return;
    jobsWritten.current = null;
    const next = about.timeline.map((j) => ({ ...j }));
    timelineRef.current = next;
    setTimeline(next);
  }, [about.timeline]);
  // Old copy tolerance: a trailing list of links to these publications is
  // dropped from the story (the block below shows them). Edit mode keeps the
  // stored text as is, so the editor never rewrites what it didn't show.
  const pubUrls = [...publications, ...DEFAULT_PUBLICATIONS].map((p) => p.url);
  const shownBody = editOn ? body : stripPublicationLinksInBody(body, pubUrls);
  const storyCount = splitSections(body.replace(/\r\n?/g, "\n")).sections.length;
  const layout = parseLayout(layoutRaw, storyCount, timeline.length, 1);
  const recordsBySection = recordsAfterStory(layout);
  const es = locale !== "en";

  const adopt = (nextBody: string, nextLayout: string) => {
    const b = stored(nextBody);
    const l = stored(nextLayout);
    bodyRef.current = b;
    layoutRef.current = l;
    written.current = { body: b, layout: l };
    setBody(b);
    setLayoutRaw(l);
    return { body: b, layout: l };
  };

  const persistStory = async (nextBody: string, nextLayout: string): Promise<string | null> => {
    const prevBody = bodyRef.current;
    const prevLayout = layoutRef.current;
    const saved = adopt(nextBody, nextLayout);
    const errBody = await saveCopy("about.body", locale, saved.body);
    if (errBody) {
      bodyRef.current = prevBody;
      layoutRef.current = prevLayout;
      written.current = null;
      setBody(prevBody);
      setLayoutRaw(prevLayout);
      return errBody;
    }
    if (saved.layout !== stored(prevLayout)) {
      const errLayout = await saveCopy("about.layout", locale, saved.layout);
      if (errLayout) {
        layoutRef.current = prevLayout;
        setLayoutRaw(prevLayout);
        written.current = { body: saved.body, layout: prevLayout };
        return errLayout;
      }
    }
    router.refresh();
    return null;
  };

  const insertAt = async (at: number, title: string, text: string) => {
    const current = bodyRef.current;
    const n = splitSections(current.replace(/\r\n?/g, "\n")).sections.length;
    const index = Math.max(0, Math.min(at, n));
    const nextBody = insertSection(current, index, title, text);
    const parsed = parseLayout(layoutRef.current, n, timelineRef.current.length, 1);
    const nextLayout = serializeLayout(insertStory(parsed, index - 1));
    setReveal({ id: ++revealSeq.current, index });
    return persistStory(nextBody, nextLayout);
  };

  const deleteAt = async (index: number) => {
    const current = bodyRef.current;
    const n = splitSections(current.replace(/\r\n?/g, "\n")).sections.length;
    const nextBody = deleteSection(current, index);
    const parsed = parseLayout(layoutRef.current, n, timelineRef.current.length, 1);
    const nextLayout = serializeLayout(removeStory(parsed, index));
    return persistStory(nextBody, nextLayout);
  };

  const addJobAfter = async (after: number) => {
    const L = es
      ? { period: "Fecha - Fecha", role: "Puesto", org: "Empresa", desc: "Descripción." }
      : { period: "Date - Date", role: "Role", org: "Company", desc: "Description." };
    const n = timelineRef.current.length;
    const job: Job = { period: L.period, title: L.role, org: L.org, description: L.desc, accent: "", hidden: "" };
    const nextTimeline = [...timelineRef.current, job];
    const stories = splitSections(bodyRef.current.replace(/\r\n?/g, "\n")).sections.length;
    const parsed = parseLayout(layoutRef.current, stories, n, 1);
    const nextLayout = serializeLayout(insertJob(parsed, after, n));
    const prevTimeline = timelineRef.current;
    const prevLayout = layoutRef.current;
    timelineRef.current = nextTimeline;
    jobsWritten.current = jobSig(nextTimeline);
    setTimeline(nextTimeline);
    adopt(bodyRef.current, nextLayout);
    const fields = [["period", job.period], ["title", job.title], ["org", job.org], ["description", job.description]] as const;
    let err: string | null = null;
    for (const [f, v] of fields) {
      if (!err) err = await saveCopy(`about.timeline.${n}.${f}`, locale, v);
    }
    if (!err) err = await saveCopy("about.layout", locale, stored(nextLayout));
    if (err) {
      timelineRef.current = prevTimeline;
      jobsWritten.current = null;
      setTimeline(prevTimeline);
      adopt(bodyRef.current, prevLayout);
      written.current = null;
      return err;
    }
    router.refresh();
    return null;
  };

  const deleteJob = async (index: number) => {
    if (!window.confirm(es ? "¿Borrar esta experiencia? No se puede deshacer." : "Delete this experience? This can't be undone.")) return;
    const prev = timelineRef.current;
    const next = prev.map((j, i) => (i === index ? { ...j, hidden: "1" } : j));
    timelineRef.current = next;
    jobsWritten.current = jobSig(next);
    setTimeline(next);
    const err = await saveCopy(`about.timeline.${index}.hidden`, locale, "1");
    if (err) {
      timelineRef.current = prev;
      jobsWritten.current = null;
      setTimeline(prev);
      window.alert(es ? `No se pudo borrar (${err})` : `Couldn't delete (${err})`);
      return;
    }
    router.refresh();
  };

  const recordNode = (r: LayoutItem) => {
    if (r.kind === "pubs") return <Publications key={`pubs-${r.index}`} items={publications} />;
    const item = timeline[r.index];
    if (!item || item.hidden === "1") return null;
    return (
      <JobCard
        key={`job-${r.index}`}
        item={item}
        i={r.index}
        label={t.ui.experience}
        onDelete={editOn ? () => void deleteJob(r.index) : undefined}
        deleteLabel={es ? "Borrar" : "Delete"}
      />
    );
  };
  const addHere = (after: number) =>
    editOn ? (
      <AddSlot
        after={after}
        onStory={(at) => insertAt(at + 1, es ? "Nuevo relato" : "New story", es ? "Escribí acá." : "Write here.")}
        onJob={addJobAfter}
      />
    ) : null;

  return (
    <PageShell title={about.title}>
      <div className="space-y-8">
        <div
          className="cp-panel about-story"
          style={{ ["--cp-accent" as string]: "var(--section-about)" }}
        >
          <span className="cp-nav-frame" aria-hidden>
            <span className="cp-nav-corner cp-nav-corner-tl" />
            <span className="cp-nav-corner cp-nav-corner-br" />
          </span>
          <div className="cp-panel-inner space-y-4">
            <CopyText as="p" className="cp-headline" copyKey="about.headline" value={about.headline} />
            <CopyMarkdown
              copyKey="about.body"
              text={shownBody}
              sections
              onInsertSection={editOn ? insertAt : undefined}
              onDeleteSection={editOn ? deleteAt : undefined}
              onBodyChange={editOn ? (next) => adopt(next, layoutRef.current) : undefined}
              revealSection={reveal}
              afterSection={(si) => (
                <>
                  {(recordsBySection.get(si) ?? []).map(recordNode)}
                  {addHere(si)}
                </>
              )}
            />
            {/* A body without "## " sections has no accordion slots: records still render. */}
            {storyCount === 0 ? (
              <>
                {(recordsBySection.get(-1) ?? []).map(recordNode)}
                {addHere(-1)}
              </>
            ) : null}
          </div>
        </div>

        <section aria-label={t.tastes.title}>
          <div className="cp-list">
            {linkedInHref ? (
              <CpRow
                href={linkedInHref}
                label={about.linkedInCta}
                detail={about.linkedInDetail}
                accent="#0A66C2"
                Icon={LinkedInIcon}
                iconClass="text-[#0A66C2]"
                iconSize="lg"
              />
            ) : null}
            {platforms.map((p) =>
              tasteHref[p.id] ? (
                <CpRow
                  key={p.id}
                  href={tasteHref[p.id]}
                  label={p.label}
                  detail={t.tastes.platforms[p.id]}
                  accent={p.accent}
                  Icon={p.Icon as ComponentType<{ className?: string }>}
                  iconClass={p.iconClass}
                  iconSize="lg"
                />
              ) : null,
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

const addLabels = {
  es: { add: "Agregar", story: "Relato", job: "Experiencia laboral", error: "No se pudo guardar" },
  en: { add: "Add", story: "Story", job: "Work experience", error: "Could not save" },
} as const;

/** Admin-only "+" between items: add a story section or a job card right here. */
function AddSlot({ after, onStory, onJob }: { after: number; onStory: (after: number) => Promise<string | null>; onJob: (after: number) => Promise<string | null> }) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const L = addLabels[locale === "en" ? "en" : "es"];
  const run = async (kind: "story" | "job") => {
    setBusy(true);
    const err = kind === "story" ? await onStory(after) : await onJob(after);
    setBusy(false);
    setOpen(false);
    if (err) window.alert(`${L.error}: ${err}`);
  };
  return (
    <div className="story-add">
      {open ? (
        <div className="story-add-menu" role="group" aria-label={L.add}>
          <button type="button" disabled={busy} onClick={() => run("story")}>{L.story}</button>
          <button type="button" disabled={busy} onClick={() => run("job")}>{L.job}</button>
          <button type="button" disabled={busy} aria-label="×" onClick={() => setOpen(false)}>×</button>
        </div>
      ) : (
        <button type="button" className="story-add-btn" aria-label={L.add} title={L.add} onClick={() => setOpen(true)}>+</button>
      )}
    </div>
  );
}

function JobCard({ item, i, label, onDelete, deleteLabel }: { item: Job; i: number; label: string; onDelete?: () => void; deleteLabel?: string }) {
  const logo = orgLogos[item.org];
  const accent = /^#[0-9a-f]{3,8}$/i.test(item.accent ?? "") ? item.accent! : timelineAccents[i % timelineAccents.length];
  return (
    <aside className="job-card tl-item" data-brand-accent={accent === item.accent ? "" : undefined} style={{ ["--cp-accent" as string]: accent }} aria-label={`${label}: ${item.org}`}>
      {logo ? (
        <span className={`tl-logo job-logo${logo.type === "image" && logo.light ? " job-logo-light" : ""} inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden sm:h-16 sm:w-16`}>
          {logo.type === "image" ? (
            <Image src={logo.src} alt={logo.alt} width={64} height={64} className={`h-full w-full ${logo.light ? "object-contain" : "object-cover"}`} />
          ) : (
            <logo.Icon className="h-12 w-12 text-foreground sm:h-14 sm:w-14" />
          )}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="job-meta">
          <span className="job-tag">{label}</span>
          <CopyText as="span" className="job-period" copyKey={`about.timeline.${i}.period`} value={item.period} />
          {onDelete ? (
            <button type="button" className="md-acc-del" aria-label={`${deleteLabel ?? "Delete"}: ${item.org}`} title={deleteLabel} onClick={onDelete}>
              {deleteLabel}
            </button>
          ) : null}
        </div>
        <CopyText as="p" className="job-org" copyKey={`about.timeline.${i}.org`} value={item.org} />
        <CopyText as="p" className="job-role" copyKey={`about.timeline.${i}.title`} value={item.title} />
        <CopyMarkdown copyKey={`about.timeline.${i}.description`} text={item.description} className="mt-1.5" pClass="cp-prose text-[0.88rem]" />
      </div>
    </aside>
  );
}
