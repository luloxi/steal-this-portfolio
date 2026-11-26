/**
 * Illustrations for the recipe cards (own drawings, no stock photos).
 * Colours come from --rc-a / --rc-b / --rc-c on the card, so they follow the
 * pastel light theme and the neon dark one.
 */
const ink = "var(--ln-ink)";
const stroke = { stroke: ink, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

function Meeting() {
  return (
    <>
      <rect x="34" y="40" width="96" height="58" rx="16" fill="var(--rc-a)" {...{ stroke: ink, strokeWidth: 3 }} />
      <path d="M58 98 l-8 18 l24 -18" fill="var(--rc-a)" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M54 62 h56 M54 78 h36" {...stroke} />
      <path d="M146 82 h24 m-8 -8 l8 8 l-8 8" {...stroke} />
      <rect x="186" y="34" width="86" height="108" rx="12" fill="var(--rc-surface)" stroke={ink} strokeWidth="3" />
      <circle cx="208" cy="58" r="9" fill="var(--rc-b)" stroke={ink} strokeWidth="2.5" />
      <path d="M224 54 h32 M224 64 h22 M202 86 h56 M202 100 h44" {...stroke} />
      <path d="M204 120 l7 7 l13 -14" {...stroke} stroke="var(--rc-c)" strokeWidth="4" />
      <path d="M262 130 a14 14 0 0 1 28 0 v10 h-28 z" fill="var(--rc-c)" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="276" cy="146" r="4" fill={ink} />
    </>
  );
}

function Receipt() {
  return (
    <>
      <path d="M48 28 h80 v120 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 z" fill="var(--rc-surface)" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M64 52 h48 M64 68 h32 M64 84 h40 M64 108 h48" {...stroke} />
      <circle cx="128" cy="132" r="18" fill="var(--rc-b)" stroke={ink} strokeWidth="3" />
      <path d="M128 123 v18 M123 127 h8 a3 3 0 0 1 0 6 h-6 a3 3 0 0 0 0 6 h8" {...stroke} strokeWidth="2.5" />
      <path d="M158 88 h22 m-8 -8 l8 8 l-8 8" {...stroke} />
      <rect x="194" y="40" width="96" height="100" rx="12" fill="var(--rc-a)" stroke={ink} strokeWidth="3" />
      <path d="M194 66 h96 M194 92 h96 M194 116 h96 M226 40 v100" stroke={ink} strokeWidth="2.5" />
      <rect x="232" y="72" width="50" height="14" rx="4" fill="var(--rc-c)" />
      <rect x="232" y="98" width="34" height="12" rx="4" fill="var(--rc-surface)" stroke={ink} strokeWidth="2" />
    </>
  );
}

function Monday() {
  return (
    <>
      <rect x="40" y="36" width="104" height="104" rx="14" fill="var(--rc-surface)" stroke={ink} strokeWidth="3" />
      <path d="M40 64 h104" stroke={ink} strokeWidth="3" />
      <rect x="40" y="36" width="104" height="28" rx="14" fill="var(--rc-c)" stroke={ink} strokeWidth="3" />
      <path d="M68 28 v16 M116 28 v16" {...stroke} />
      <text x="92" y="118" textAnchor="middle" fontSize="44" fontWeight="700" fill={ink} fontFamily="inherit">L</text>
      <rect x="170" y="96" width="20" height="40" rx="5" fill="var(--rc-a)" stroke={ink} strokeWidth="3" />
      <rect x="200" y="74" width="20" height="62" rx="5" fill="var(--rc-b)" stroke={ink} strokeWidth="3" />
      <rect x="230" y="54" width="20" height="82" rx="5" fill="var(--rc-a)" stroke={ink} strokeWidth="3" />
      <path d="M262 112 h22 v18 a11 11 0 0 1 -22 0 z M284 116 a7 7 0 0 1 0 12" fill="var(--rc-surface)" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M268 100 q4 -6 0 -12 M278 100 q4 -6 0 -12" {...stroke} strokeWidth="2.5" />
    </>
  );
}

function Newsletter() {
  return (
    <>
      <rect x="60" y="58" width="150" height="96" rx="12" fill="var(--rc-a)" stroke={ink} strokeWidth="3" />
      <rect x="80" y="24" width="110" height="92" rx="8" fill="var(--rc-surface)" stroke={ink} strokeWidth="3" />
      <rect x="94" y="38" width="38" height="28" rx="5" fill="var(--rc-b)" />
      <path d="M142 42 h34 M142 54 h26 M94 80 h82 M94 94 h64" {...stroke} />
      <path d="M60 70 l75 52 l75 -52 v84 h-150 z" fill="var(--rc-a)" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M244 46 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 z" fill="var(--rc-c)" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M268 104 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4 z" fill="var(--rc-b)" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  );
}

const ART: Record<string, () => React.JSX.Element> = {
  "reunion-a-ficha": Meeting,
  "gastos-y-cobros": Receipt,
  "resumen-del-lunes": Monday,
  "boletin-a-medida": Newsletter,
};

export function RecipeArt({ slug }: { slug: string }) {
  const Art = ART[slug];
  return (
    <svg className="rc-art" viewBox="0 0 320 176" role="presentation" aria-hidden focusable="false">
      {Art ? <Art /> : null}
    </svg>
  );
}
