/**
 * Mini demos for the home Servicios examples (SVG + CSS keyframes in home.css, no JS).
 * aria-hidden: the card text says what each one shows. Everything stops under reduced motion.
 */
import type { ShowcaseArt } from "@/content/showcase";

const box = { viewBox: "0 0 160 96", "aria-hidden": true, focusable: false } as const;

/** A client card that fills itself in (meeting note, email, money in and out) and a chat bubble to ask about it. */
function Clients() {
  return (
    <svg className="sc-art" {...box}>
      <rect x="8" y="8" width="96" height="80" rx="10" className="sc-panel" />
      <circle cx="22" cy="23" r="7" className="sc-avatar" />
      <rect x="34" y="19" width="40" height="4" rx="2" className="sc-line" />
      <rect x="34" y="26" width="24" height="3" rx="1.5" className="sc-line is-dim" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="20" cy={45 + i * 13} r="3" className="sc-coin" />
          <rect x="28" y={43 + i * 13} width={[62, 50, 40][i]} height="5" rx="2.5" className="sc-type" style={{ animationDelay: `${i * 0.5}s` }} />
        </g>
      ))}
      <g className="sc-pop" style={{ animationDelay: "1.8s" }}>
        <rect x="108" y="22" width="46" height="18" rx="9" className="sc-bubble is-me" />
        <text x="131" y="34" textAnchor="middle" className="sc-label">?</text>
      </g>
      <g className="sc-pop" style={{ animationDelay: "2.4s" }}>
        <rect x="112" y="46" width="42" height="14" rx="7" className="sc-bubble" />
      </g>
    </svg>
  );
}

/** A sheet whose rows fill in by themselves, then a check to approve. */
function Autofill() {
  return (
    <svg className="sc-art" {...box}>
      <rect x="14" y="8" width="96" height="80" rx="8" className="sc-panel" />
      <rect x="14" y="8" width="96" height="14" rx="7" className="sc-chip is-dim" />
      <line x1="46" y1="22" x2="46" y2="88" className="sc-ring" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="20" y={30 + i * 14} width="20" height="5" rx="2.5" className="sc-line is-dim" />
          <rect x="52" y={30 + i * 14} width={[50, 40, 46, 32][i]} height="5" rx="2.5" className="sc-type" style={{ animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}
      <g className="sc-pop" style={{ animationDelay: "2s" }}>
        <rect x="112" y="64" width="42" height="18" rx="9" className="sc-pill" />
        <text x="133" y="76" textAnchor="middle" className="sc-label">✓</text>
      </g>
    </svg>
  );
}

/** A newsletter and a post drafting themselves, waiting for your OK. */
function Drafts() {
  return (
    <svg className="sc-art" {...box}>
      <rect x="10" y="14" width="62" height="70" rx="8" className="sc-panel" />
      <path d="M10 22 l31 20 l31 -20" className="sc-stroke" />
      {[0, 1].map((i) => (
        <rect key={i} x="18" y={54 + i * 10} width={[44, 32][i]} height="5" rx="2.5" className="sc-type" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
      <rect x="80" y="8" width="66" height="60" rx="8" className="sc-panel" />
      <circle cx="92" cy="20" r="5" className="sc-avatar" />
      <rect x="100" y="18" width="30" height="4" rx="2" className="sc-line" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="88" y={32 + i * 9} width={[50, 44, 30][i]} height="5" rx="2.5" className="sc-type" style={{ animationDelay: `${0.4 + i * 0.5}s` }} />
      ))}
      <g className="sc-pop" style={{ animationDelay: "2s" }}>
        <rect x="96" y="72" width="50" height="18" rx="9" className="sc-pill" />
        <text x="121" y="84" textAnchor="middle" className="sc-label">OK</text>
      </g>
    </svg>
  );
}

const ARTS: Record<ShowcaseArt, () => React.ReactElement> = {
  clients: Clients,
  autofill: Autofill,
  drafts: Drafts,
};

export function ShowcaseVisual({ art }: { art: ShowcaseArt }) {
  const Art = ARTS[art];
  return <Art />;
}
