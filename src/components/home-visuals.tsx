/**
 * Decorative, lightweight SVG visuals for the landing (no JS, no libraries).
 * Motion: CSS keyframes (home.css) plus SMIL dots along paths; everything stops
 * under prefers-reduced-motion (the dots group is hidden there). aria-hidden: the
 * text next to each visual already says what it shows.
 */

/** Hero: tasks flow from mail, sheet and receipt into an AI agent, which fills a CRM card. */
export function AgentFlow() {
  const inputs = [
    { y: 34, label: "mail", color: "var(--section-contact)" },
    { y: 96, label: "xls", color: "var(--section-blog)" },
    { y: 158, label: "pdf", color: "var(--section-projects)" },
  ];
  const paths = ["M112 54 C 150 54, 150 110, 168 110", "M112 116 L 168 110", "M112 178 C 150 178, 150 110, 168 110"];
  const out = "M232 110 C 248 110, 250 110, 262 110";
  return (
    <svg className="hm-flow" viewBox="0 0 360 220" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hm-core" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".95" />
          <stop offset="35%" style={{ stopColor: "var(--accent)" }} />
          <stop offset="100%" style={{ stopColor: "var(--neon-orange)" }} />
        </radialGradient>
        <filter id="hm-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Rothko field behind the agent */}
      <ellipse cx="200" cy="110" rx="120" ry="80" style={{ fill: "var(--accent)" }} opacity=".10" filter="url(#hm-glow)" />

      {paths.map((d, i) => (
        <path key={d} d={d} className="hm-flow-line" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
      <path d={out} className="hm-flow-line" />

      {inputs.map((it, i) => (
        <g key={it.label} className="hm-flow-chip" style={{ ["--chip" as string]: it.color, animationDelay: `${i * 0.35}s` }}>
          <rect x="18" y={it.y} width="94" height="40" rx="10" />
          <rect x="28" y={it.y + 11} width="18" height="18" rx="4" className="hm-flow-chip-icon" />
          <rect x="54" y={it.y + 13} width="46" height="5" rx="2.5" className="hm-flow-chip-line" />
          <rect x="54" y={it.y + 23} width="30" height="5" rx="2.5" className="hm-flow-chip-line is-dim" />
          <text x="37" y={it.y + 24} textAnchor="middle" className="hm-flow-chip-label">{it.label}</text>
        </g>
      ))}

      {/* Agent core */}
      <g className="hm-flow-core">
        <circle cx="200" cy="110" r="44" className="hm-flow-orbit" />
        <circle cx="200" cy="110" r="34" fill="url(#hm-core)" className="hm-flow-pulse" />
        <circle cx="200" cy="110" r="34" fill="none" style={{ stroke: "var(--accent)" }} strokeOpacity=".5" />
        <text x="200" y="116" textAnchor="middle" className="hm-flow-core-label">IA</text>
      </g>

      {/* Output card: rows fill in turn */}
      <g className="hm-flow-card">
        <rect x="262" y="52" width="82" height="116" rx="12" />
        <rect x="274" y="64" width="40" height="6" rx="3" className="hm-flow-card-title" />
        {[0, 1, 2, 3].map((r) => (
          <g key={r} transform={`translate(0 ${r * 22})`}>
            <circle cx="279" cy="88" r="4" className="hm-flow-card-dot" style={{ animationDelay: `${r * 0.6}s` }} />
            <rect x="288" y="85" width="44" height="6" rx="3" className="hm-flow-card-row" style={{ animationDelay: `${r * 0.6}s` }} />
          </g>
        ))}
      </g>

      {/* Moving tasks (hidden under reduced motion) */}
      <g className="hm-flow-dots">
        {paths.map((d, i) => (
          <circle key={d} r="4" style={{ fill: inputs[i].color }}>
            <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${i * 0.8}s`} path={d} />
          </circle>
        ))}
        <circle r="4" style={{ fill: "var(--accent-2)" }}>
          <animateMotion dur="1.2s" repeatCount="indefinite" begin="0.6s" path={out} />
        </circle>
      </g>
    </svg>
  );
}

/** Example 1: an inbox sorted into tags; the urgent one pulses. */
export function MailSort() {
  return (
    <svg className="hm-ill" viewBox="0 0 120 72" aria-hidden="true" focusable="false">
      <g className="hm-ill-mail">
        <rect x="8" y="16" width="44" height="32" rx="6" />
        <path d="M10 19 L30 34 L50 19" />
      </g>
      <path d="M56 32 H66" className="hm-ill-arrow" />
      {[
        { y: 10, c: "var(--section-blog)", w: 34 },
        { y: 28, c: "var(--section-projects)", w: 28 },
        { y: 46, c: "var(--accent)", w: 40, urgent: true },
      ].map((t, i) => (
        <rect key={t.y} x="72" y={t.y} width={t.w} height="12" rx="6" className={`hm-ill-tag${t.urgent ? " is-urgent" : ""}`} style={{ fill: t.c, animationDelay: `${i * 0.5}s` }} />
      ))}
    </svg>
  );
}

/** Example 2: cells from a sheet travel into a CRM card. */
export function DataMove() {
  const line = "M46 36 C 60 36, 62 36, 76 36";
  return (
    <svg className="hm-ill" viewBox="0 0 120 72" aria-hidden="true" focusable="false">
      <g className="hm-ill-sheet">
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`${r}${c}`} x={10 + c * 12} y={18 + r * 12} width="10" height="10" rx="2" style={{ animationDelay: `${(r * 3 + c) * 0.15}s` }} />
          )),
        )}
      </g>
      <path d={line} className="hm-ill-arrow" />
      <g className="hm-ill-crm">
        <rect x="78" y="14" width="34" height="44" rx="6" />
        <circle cx="88" cy="26" r="4" />
        <rect x="95" y="24" width="12" height="4" rx="2" />
        <rect x="84" y="36" width="22" height="4" rx="2" />
        <rect x="84" y="45" width="16" height="4" rx="2" />
      </g>
      <g className="hm-flow-dots">
        <circle r="3" style={{ fill: "var(--section-blog)" }}>
          <animateMotion dur="1.6s" repeatCount="indefinite" path={line} />
        </circle>
      </g>
    </svg>
  );
}

/** Example 3: a receipt gets scanned and its fields pop out. */
export function ReceiptScan() {
  return (
    <svg className="hm-ill" viewBox="0 0 120 72" aria-hidden="true" focusable="false">
      <g className="hm-ill-receipt">
        <path d="M14 8 H50 V64 L44 60 L38 64 L32 60 L26 64 L20 60 L14 64 Z" />
        {[18, 26, 34, 42].map((y, i) => (
          <rect key={y} x="20" y={y} width={i % 2 ? 18 : 24} height="3" rx="1.5" />
        ))}
      </g>
      <rect x="10" y="10" width="44" height="3" rx="1.5" className="hm-ill-scan" />
      {[
        { y: 14, w: 30, c: "var(--section-projects)" },
        { y: 30, w: 22, c: "var(--section-blog)" },
        { y: 46, w: 36, c: "var(--section-contact)" },
      ].map((f, i) => (
        <rect key={f.y} x="70" y={f.y} width={f.w} height="11" rx="5.5" className="hm-ill-field" style={{ fill: f.c, animationDelay: `${0.4 + i * 0.45}s` }} />
      ))}
    </svg>
  );
}
