"use client";

import { useLocale } from "@/i18n/locale-provider";
import { formatTalkPeriod, TALKS, type Talk } from "@/content/talks";

const labels = {
  es: { tag: "Charlas", marker: "Charla", open: "abre en otra pestaña" },
  en: { tag: "Talks", marker: "Talk", open: "opens in a new tab" },
} as const;

function TalkCopy({ talk, lang, open }: { talk: Talk; lang: "es" | "en"; open: string }) {
  const c = talk[lang];
  return (
    <p className="talk-text">
      {c.before}
      <a href={talk.url} target="_blank" rel="noopener noreferrer" className="talk-link">
        {c.link}
        <span className="sr-only"> ({open})</span>
      </a>
      {c.after}
    </p>
  );
}

function TalkMedia({ talk, lang }: { talk: Talk; lang: "es" | "en" }) {
  if (talk.photos.length === 0) return null;
  return (
    <div className="talk-photos" data-count={talk.photos.length}>
      {talk.photos.map((ph) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={ph.src} src={ph.src} alt={ph.alt[lang]} width={ph.width} height={ph.height} loading="lazy" decoding="async" className="talk-photo" />
      ))}
    </div>
  );
}

function TalkLogo({ talk, lang }: { talk: Talk; lang: "es" | "en" }) {
  if (!talk.image) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={talk.image.src} alt={talk.image.alt[lang]} width={talk.image.width} height={talk.image.height} loading="lazy" decoding="async" className="talk-logo" />;
}

/** Sobre mí "Charlas" block: leftover talks that are not milestones in Experiencia. Hidden when empty. */
export function Talks({ items = TALKS }: { items?: readonly Talk[] }) {
  const { locale } = useLocale();
  const lang = locale === "en" ? "en" : "es";
  const L = labels[lang];
  if (items.length === 0) return null;
  return (
    <section className="pubs talks" aria-label={L.tag} data-testid="talks">
      <div className="pubs-head">
        <span className="pubs-tag">{L.tag}</span>
      </div>
      <ul className="talks-list">
        {items.map((talk) => (
          <li key={talk.url} className="talk">
            <div className="talk-row">
              <TalkLogo talk={talk} lang={lang} />
              <TalkCopy talk={talk} lang={lang} open={L.open} />
            </div>
            <TalkMedia talk={talk} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * A talk placed among experience cards: same milestone card, with a Charla/Talk marker.
 */
export function TalkMilestone({ talk }: { talk: Talk }) {
  const { locale } = useLocale();
  const lang = locale === "en" ? "en" : "es";
  const L = labels[lang];
  const title = talk[lang].link;
  return (
    <aside
      className="job-card talk-card"
      style={{ ["--cp-accent" as string]: "var(--section-about)" }}
      aria-label={`${L.marker}: ${title}`}
      data-testid="talk-milestone"
    >
      {talk.image ? (
        <span className="tl-logo job-logo inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden sm:h-16 sm:w-16">
          <TalkLogo talk={talk} lang={lang} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="job-meta">
          <span className="job-tag">{L.marker}</span>
          <span className="job-period">{formatTalkPeriod(talk.date, lang)}</span>
        </div>
        <TalkCopy talk={talk} lang={lang} open={L.open} />
        <TalkMedia talk={talk} lang={lang} />
      </div>
    </aside>
  );
}
