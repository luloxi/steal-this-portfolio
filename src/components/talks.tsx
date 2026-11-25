"use client";

import { useLocale } from "@/i18n/locale-provider";
import { TALKS, type Talk } from "@/content/talks";

const labels = { es: { tag: "Charlas", open: "abre en otra pestaña" }, en: { tag: "Talks", open: "opens in a new tab" } } as const;

/** Sobre mí "Charlas" block: one or two lines per talk, linked to its event page, with optional photos. */
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
        {items.map((talk) => {
          const c = talk[lang];
          return (
            <li key={talk.url} className="talk">
              <p className="talk-text">
                {c.before}
                <a href={talk.url} target="_blank" rel="noopener noreferrer" className="talk-link">
                  {c.link}
                  <span className="sr-only"> ({L.open})</span>
                </a>
                {c.after}
              </p>
              {talk.photos.length > 0 ? (
                <div className="talk-photos" data-count={talk.photos.length}>
                  {talk.photos.map((ph) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={ph.src} src={ph.src} alt={ph.alt[lang]} width={ph.width} height={ph.height} loading="lazy" decoding="async" className="talk-photo" />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
