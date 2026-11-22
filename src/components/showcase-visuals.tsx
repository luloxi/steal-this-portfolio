/**
 * Mini demos for "Automatizando procesos" (SVG + CSS keyframes in home.css, no JS).
 * aria-hidden: the card text says what each one shows. Everything stops under reduced motion.
 */
import type { ShowcaseArt } from "@/content/showcase";

const box = { viewBox: "0 0 160 96", "aria-hidden": true, focusable: false } as const;

function Code() {
  return (
    <svg className="sc-art" {...box}>
      <rect x="8" y="10" width="96" height="76" rx="9" className="sc-panel" />
      <circle cx="18" cy="20" r="2.5" className="sc-dot" />
      <circle cx="26" cy="20" r="2.5" className="sc-dot" />
      <circle cx="34" cy="20" r="2.5" className="sc-dot" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={18 + (i % 2) * 8} y={32 + i * 12} width={[60, 44, 52, 30][i]} height="5" rx="2.5" className="sc-type" style={{ animationDelay: `${i * 0.45}s` }} />
      ))}
      <g className="sc-pop" style={{ animationDelay: "2s" }}>
        <rect x="112" y="22" width="40" height="18" rx="9" className="sc-pill" />
        <text x="132" y="34" textAnchor="middle" className="sc-label">PR ✓</text>
      </g>
      <g className="sc-bob">
        <path d="M118 70 a10 10 0 0 1 4-19 a13 13 0 0 1 24 4 a8 8 0 0 1 0 15 z" className="sc-cloud" />
        <path d="M132 66 v-12 m-5 5 l5 -5 l5 5" className="sc-stroke" />
      </g>
    </svg>
  );
}

function Bookmarks() {
  return (
    <svg className="sc-art" {...box}>
      <path d="M96 40 h18 l6 6 h30 v34 a6 6 0 0 1 -6 6 h-42 a6 6 0 0 1 -6 -6 z" className="sc-folder" />
      <g className="sc-move">
        <rect x="10" y="20" width="62" height="20" rx="10" className="sc-chip" />
        <path d="M22 30 h6 m-3 -3 v6" className="sc-stroke" />
        <rect x="34" y="28" width="30" height="4" rx="2" className="sc-line" />
      </g>
      <rect x="10" y="56" width="52" height="16" rx="8" className="sc-chip is-dim" />
      <rect x="104" y="58" width="36" height="4" rx="2" className="sc-line sc-type" style={{ animationDelay: "1.4s" }} />
      <rect x="104" y="66" width="26" height="4" rx="2" className="sc-line sc-type" style={{ animationDelay: "1.7s" }} />
    </svg>
  );
}

function Social() {
  return (
    <svg className="sc-art" {...box}>
      <rect x="20" y="8" width="96" height="80" rx="10" className="sc-panel" />
      <circle cx="34" cy="24" r="7" className="sc-avatar" />
      <rect x="46" y="20" width="40" height="4" rx="2" className="sc-line" />
      <rect x="46" y="27" width="24" height="3" rx="1.5" className="sc-line is-dim" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="30" y={40 + i * 10} width={[74, 66, 48][i]} height="5" rx="2.5" className="sc-type" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
      <g className="sc-pop" style={{ animationDelay: "1.8s" }}>
        <rect x="104" y="64" width="50" height="18" rx="9" className="sc-pill" />
        <text x="129" y="76" textAnchor="middle" className="sc-label">draft</text>
      </g>
    </svg>
  );
}

function WhatsApp() {
  return (
    <svg className="sc-art" {...box}>
      <rect x="34" y="4" width="70" height="88" rx="12" className="sc-panel" />
      <g className="sc-pop" style={{ animationDelay: "0s" }}>
        <rect x="42" y="16" width="44" height="14" rx="7" className="sc-bubble" />
      </g>
      <g className="sc-pop" style={{ animationDelay: ".8s" }}>
        <rect x="52" y="36" width="44" height="14" rx="7" className="sc-bubble is-me" />
      </g>
      <g className="sc-pop" style={{ animationDelay: "1.6s" }}>
        <rect x="42" y="56" width="36" height="14" rx="7" className="sc-bubble" />
      </g>
      <g className="sc-typing" style={{ animationDelay: "2.2s" }}>
        <circle cx="74" cy="80" r="2.4" />
        <circle cx="81" cy="80" r="2.4" />
        <circle cx="88" cy="80" r="2.4" />
      </g>
      <g className="sc-pop" style={{ animationDelay: "2.4s" }}>
        <rect x="108" y="38" width="46" height="18" rx="9" className="sc-pill" />
        <text x="131" y="50" textAnchor="middle" className="sc-label">✓✓</text>
      </g>
    </svg>
  );
}

function Routines() {
  return (
    <svg className="sc-art" {...box}>
      <circle cx="48" cy="48" r="30" className="sc-panel" />
      <circle cx="48" cy="48" r="30" className="sc-ring" />
      <line x1="48" y1="48" x2="48" y2="30" className="sc-hand sc-spin" />
      <line x1="48" y1="48" x2="62" y2="48" className="sc-hand is-short" />
      <circle cx="48" cy="48" r="3" className="sc-coin" />
      <g className="sc-swing">
        <path d="M118 30 a12 12 0 0 1 12 12 v10 l5 6 h-34 l5 -6 v-10 a12 12 0 0 1 12 -12 z" className="sc-bell" />
        <circle cx="118" cy="62" r="3.5" className="sc-coin" />
      </g>
      <rect x="96" y="74" width="48" height="6" rx="3" className="sc-type" style={{ animationDelay: ".6s" }} />
    </svg>
  );
}

const ARTS: Record<ShowcaseArt, () => React.ReactElement> = {
  code: Code,
  bookmarks: Bookmarks,
  social: Social,
  whatsapp: WhatsApp,
  routines: Routines,
};

export function ShowcaseVisual({ art }: { art: ShowcaseArt }) {
  const Art = ARTS[art];
  return <Art />;
}
