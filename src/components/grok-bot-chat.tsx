import type { Locale } from "@/i18n/types";

/**
 * Animated chat demo for the Grok Bot pages (CSS only, example data, no real people).
 * A person asks the fleet for two things; a bot answers each with a result card.
 * Loops every 12 s; under prefers-reduced-motion everything shows at once, still.
 */
const COPY: Record<Locale, { label: string; fleet: string; ask1: string; res1: { title: string; rows: string[] }; ask2: string; res2: { title: string; rows: string[] } }> = {
  es: {
    label: "Demo: una persona le pide a sus bots que resuman sus mails y publiquen un arreglo, y cada bot responde con el resultado.",
    fleet: "Tus bots",
    ask1: "Resumí mis mails de hoy",
    res1: { title: "Resumen de hoy", rows: ["3 para responder", "1 factura para pagar", "12 newsletters archivados"] },
    ask2: "Publicá el arreglo del formulario",
    res2: { title: "Arreglo publicado", rows: ["Pruebas sin fallas", "Cambio revisado", "Ya está en la web"] },
  },
  en: {
    label: "Demo: a person asks their bots to summarize their email and ship a fix, and each bot replies with the result.",
    fleet: "Your bots",
    ask1: "Summarize today's email",
    res1: { title: "Today's summary", rows: ["3 to reply to", "1 invoice to pay", "12 newsletters archived"] },
    ask2: "Ship the contact form fix",
    res2: { title: "Fix shipped", rows: ["Tests passed", "Change reviewed", "It's live on the site"] },
  },
};

const BOTS = [
  { name: "Mail", color: "var(--gb-a)" },
  { name: "Dev", color: "var(--gb-b)" },
  { name: "Plata", color: "var(--gb-c)" },
];

function Avatar({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 32 32" className="gb-avatar" style={{ ["--gb-c0" as string]: color }} aria-hidden focusable="false">
      <rect x="4" y="7" width="24" height="20" rx="8" />
      <circle cx="12" cy="17" r="2.4" className="gb-eye" />
      <circle cx="20" cy="17" r="2.4" className="gb-eye" />
      <line x1="16" y1="2.5" x2="16" y2="7" />
      <circle cx="16" cy="2.5" r="1.8" />
    </svg>
  );
}

export function GrokBotChat({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  return (
    <figure className="gb" role="img" aria-label={c.label}>
      <div className="gb-fleet" aria-hidden>
        <span className="gb-fleet-label">{c.fleet}</span>
        {BOTS.map((b) => (
          <span key={b.name} className="gb-fleet-bot">
            <Avatar color={b.color} />
            <span>{b.name}</span>
          </span>
        ))}
      </div>
      <div className="gb-thread" aria-hidden>
        <p className="gb-msg is-me gb-s1">{c.ask1}</p>
        <div className="gb-row gb-s2">
          <Avatar color={BOTS[0].color} />
          <span className="gb-typing"><i /><i /><i /></span>
        </div>
        <div className="gb-row gb-s3">
          <Avatar color={BOTS[0].color} />
          <div className="gb-card">
            <strong>{c.res1.title}</strong>
            <ul>{c.res1.rows.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        </div>
        <p className="gb-msg is-me gb-s4">{c.ask2}</p>
        <div className="gb-row gb-s5">
          <Avatar color={BOTS[1].color} />
          <div className="gb-card is-ok">
            <strong>✓ {c.res2.title}</strong>
            <ul>{c.res2.rows.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        </div>
      </div>
    </figure>
  );
}
