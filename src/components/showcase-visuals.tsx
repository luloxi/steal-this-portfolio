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

/** A personal newsletter filling in, with topics popping in: work, plans nearby, trips, music. */
function Newsletters() {
  return (
    <svg className="sc-art" {...box}>
      <rect x="10" y="12" width="74" height="74" rx="8" className="sc-panel" />
      <path d="M10 20 l37 22 l37 -22" className="sc-stroke" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="20" y={52 + i * 9} width={[54, 44, 32][i]} height="5" rx="2.5" className="sc-type" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
      {[
        // work: briefcase
        <path key="w" d="M-6 -2 h12 v8 h-12 z M-3 -2 v-3 h6 v3" />,
        // plans nearby: map pin
        <path key="p" d="M0 7 c-5 -6 -6 -8 -6 -11 a6 6 0 0 1 12 0 c0 3 -1 5 -6 11 z M0 -6 a2 2 0 1 0 0.01 0" />,
        // trips: plane
        <path key="t" d="M-7 1 l14 -6 l-4 12 l-3 -5 z M0 2 l-2 4" />,
        // artists you follow: music note
        <path key="m" d="M-1 5 v-11 l7 -2 v10 M-1 5 a2.5 2 0 1 1 -0.01 0 M6 2 a2.5 2 0 1 1 -0.01 0" />,
      ].map((icon, i) => (
        <g key={i} className="sc-pop" style={{ animationDelay: `${0.6 + i * 0.5}s` }}>
          <circle cx={i % 2 ? 137 : 107} cy={i < 2 ? 31 : 63} r="13" className="sc-pill" />
          <g transform={`translate(${i % 2 ? 137 : 107} ${i < 2 ? 31 : 63})`} className="sc-stroke">{icon}</g>
        </g>
      ))}
    </svg>
  );
}

const ARTS: Record<ShowcaseArt, () => React.ReactElement> = {
  clients: Clients,
  autofill: Autofill,
  newsletters: Newsletters,
};

export function ShowcaseVisual({ art }: { art: ShowcaseArt }) {
  const Art = ARTS[art];
  return <Art />;
}
