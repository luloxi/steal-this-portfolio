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
import { insertSection, splitSections } from "@/lib/md-sections";
import { insertJob, insertStory, parseLayout, recordsAfterStory, serializeLayout, talksInTimeline, type LayoutItem } from "@/lib/page-layout";
import { Publications } from "@/components/publications";
import { TalkMilestone, Talks } from "@/components/talks";
import { AboutReorder } from "@/components/about-reorder";
import { TALKS, type Talk } from "@/content/talks";
import { DEFAULT_PUBLICATIONS, stripPublicationLinksInBody, type Publication } from "@/lib/publications";
import { saveCopy, useEditMode } from "@/components/admin-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSectionShown } from "@/components/site-order-context";

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
export function AboutView({ publications }: { publications: readonly Publication[] }) {
  const { t, href } = useLocale();
  const settings = useSiteSettings();
  const editOn = useEditMode();
  const blogShown = useSectionShown("blog");
  const linkedInHref = settings.socials.find((s) => s.id === "linkedin")?.href ?? "";
  const tasteHref = {
    letterboxd: settings.tasteLetterboxd,
    lastfm: settings.tasteLastfm,
    spotify: settings.tasteSpotify,
  };
  const about = t.about;
  // Old copy tolerance: a trailing list of links to these publications is
  // dropped from the story (the block below shows them). Edit mode keeps the
  // stored text as is, so the editor never rewrites what it didn't show.
  const pubUrls = [...publications, ...DEFAULT_PUBLICATIONS].map((p) => p.url);
  const body = editOn ? about.body : stripPublicationLinksInBody(about.body, pubUrls);
  const storyCount = splitSections(about.body.replace(/\r\n?/g, "\n")).sections.length;
  const layout = parseLayout(about.layout, storyCount, about.timeline.length, 1, TALKS.length > 0 ? 1 : 0, TALKS.length);
  const recordsBySection = recordsAfterStory(layout);
  const talksPlaced = talksInTimeline(layout);

  return (
    <PageShell title={about.title}>
      <div className="space-y-8">
        {/* Order (Luciano, 2026-11-28): LinkedIn, articles, experience newest first, tastes last. */}
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
          {blogShown ? (
            <CpRow
              href={href("/blog")}
              external={false}
              label={about.articlesCta}
              detail={about.articlesDetail}
              accent="var(--section-blog)"
              Icon={ArticlesIcon}
              iconClass="text-[var(--section-blog)]"
              iconSize="lg"
            />
          ) : null}
        </div>
        <div
          className="cp-panel about-story"
          style={{ ["--cp-accent" as string]: "var(--section-about)" }}
        >
          <span className="cp-nav-frame" aria-hidden>
            <span className="cp-nav-corner cp-nav-corner-tl" />
            <span className="cp-nav-corner cp-nav-corner-br" />
          </span>
          <div className="cp-panel-inner space-y-4">
            {storyCount > 0 ? <AboutReorder body={about.body} layoutRaw={about.layout} timeline={about.timeline} /> : null}
            <CopyText as="p" className="cp-headline" copyKey="about.headline" value={about.headline} />
            <CopyMarkdown
              copyKey="about.body"
              text={body}
              sections
              newestFirst
              afterSection={(si) => (
                <>
                  {(recordsBySection.get(si) ?? []).map((r, ri, recs) => {
                    if (r.kind === "pubs") return <Publications key={`pubs-${r.index}`} items={publications} />;
                    if (r.kind === "talk") {
                      const talk = TALKS[r.index];
                      if (!talk) return null;
                      if (talksPlaced.has(r.index)) return <TalkMilestone key={`talk-${r.index}`} talk={talk} />;
                      const prev = recs[ri - 1];
                      if (prev?.kind === "talk" && !talksPlaced.has(prev.index)) return null;
                      const run: Talk[] = [];
                      for (let j = ri; j < recs.length && recs[j].kind === "talk" && !talksPlaced.has(recs[j].index); j++) {
                        const item = TALKS[recs[j].index];
                        if (item) run.push(item);
                      }
                      return run.length ? <Talks key={`talks-${r.index}`} items={run} /> : null;
                    }
                    if (r.kind === "talks") {
                      const placed = new Set([...talksPlaced, ...recs.filter((x) => x.kind === "talk").map((x) => x.index)]);
                      const leftover = TALKS.filter((_, i) => !placed.has(i));
                      return leftover.length ? <Talks key={`talks-${r.index}`} items={leftover} /> : null;
                    }
                    const item = about.timeline[r.index];
                    return item ? <JobCard key={`job-${r.index}`} item={item} i={r.index} label={t.ui.experience} /> : null;
                  })}
                  <AddSlot after={si} body={about.body} timeline={about.timeline} layout={layout} />
                </>
              )}
            />
            {/* A body without "## " sections has no slots: the block goes right after it. */}
            {storyCount === 0 ? (
              <>
                <Publications items={publications} />
                <Talks />
              </>
            ) : null}
          </div>
        </div>

        <section aria-labelledby="about-tastes" className="space-y-3">
          <h2 id="about-tastes" className="about-tastes-h">
            <CopyText copyKey="tastes.heading" value={t.tastes.heading} />
          </h2>
          <div className="cp-list">
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

/** A page with lines: the link to the blog articles. */
function ArticlesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.75h8.5L19 7.25v14H6z" />
      <path d="M14.5 2.75v4.5H19M9 11.5h7M9 15h7M9 18.5h4.5" />
    </svg>
  );
}

/** accent: optional CSS color for the card ("" = theme palette). */
type Job = { period: string; title: string; org: string; description: string; accent?: string };

const addLabels = {
  es: { add: "Agregar", story: "Relato", job: "Experiencia laboral", newStory: "Nuevo relato", newStoryBody: "Escribí acá.", period: "Fecha - Fecha", role: "Puesto", org: "Empresa", desc: "Descripción.", error: "No se pudo guardar" },
  en: { add: "Add", story: "Story", job: "Work experience", newStory: "New story", newStoryBody: "Write here.", period: "Date - Date", role: "Role", org: "Company", desc: "Description.", error: "Could not save" },
} as const;

/** Admin-only "+" between items: add a story section or a job card right here. */
function AddSlot({ after, body, timeline, layout }: { after: number; body: string; timeline: readonly Job[]; layout: LayoutItem[] }) {
  const edit = useEditMode();
  const { locale } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!edit) return null;
  const L = addLabels[locale === "en" ? "en" : "es"];
  const run = async (kind: "story" | "job") => {
    setBusy(true);
    let err: string | null = null;
    if (kind === "story") {
      err = await saveCopy("about.body", locale, insertSection(body, after + 1, L.newStory, L.newStoryBody));
      if (!err) err = await saveCopy("about.layout", locale, serializeLayout(insertStory(layout, after)));
    } else {
      const n = timeline.length;
      const fields = [["period", L.period], ["title", L.role], ["org", L.org], ["description", L.desc]] as const;
      for (const [f, v] of fields) {
        if (!err) err = await saveCopy(`about.timeline.${n}.${f}`, locale, v);
      }
      if (!err) err = await saveCopy("about.layout", locale, serializeLayout(insertJob(layout, after, n)));
    }
    setBusy(false);
    setOpen(false);
    if (err) window.alert(`${L.error}: ${err}`);
    router.refresh();
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

function JobCard({ item, i, label }: { item: Job; i: number; label: string }) {
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
        </div>
        <CopyText as="p" className="job-org" copyKey={`about.timeline.${i}.org`} value={item.org} />
        <CopyText as="p" className="job-role" copyKey={`about.timeline.${i}.title`} value={item.title} />
        <CopyMarkdown copyKey={`about.timeline.${i}.description`} text={item.description} className="mt-1.5" pClass="cp-prose text-[0.88rem]" />
      </div>
    </aside>
  );
}
