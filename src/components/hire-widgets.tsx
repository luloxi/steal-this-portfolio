"use client";

import { useEffect, useRef, useState } from "react";
import { hoursDigits } from "@/lib/pricing";
import { checkCodeShape, normalizeCode, REF_PARAM, refFromCookie } from "@/lib/referrals";

export function useCountUp(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 450);
      const v = a + (value - a) * (1 - Math.pow(1 - k, 3));
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}

type RefState = "idle" | "checking" | "ok" | "unknown" | "invalid";

/** Slider + number box. Digits only; over the max snaps to the max, under the min or empty becomes the min on blur. */
export function QtySlider({ min, max, value, onChange, ariaLabel, inputLabel, clamp }: {
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
  inputLabel: string;
  clamp: (n: number) => number;
}) {
  const [text, setText] = useState<string | null>(null);
  const shown = Math.min(max, Math.max(min, value));
  const onText = (raw: string) => {
    const d = hoursDigits(raw);
    const n = Number(d);
    if (d && n > max) { setText(String(max)); onChange(max); return; }
    setText(d);
    if (n >= min) onChange(clamp(n));
  };
  const commit = () => {
    if (text !== null) onChange(clamp(Number(text)));
    setText(null);
  };
  return (
    <div className="hire-hours-row">
      <input
        className="hire-range"
        type="range"
        min={min}
        max={max}
        step={1}
        value={shown}
        aria-label={ariaLabel}
        style={{ ["--range-p" as string]: `${((shown - min) / (max - min)) * 100}%` }}
        onChange={(e) => { setText(null); onChange(Number(e.target.value)); }}
      />
      <input
        className="hire-hours-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="done"
        autoComplete="off"
        aria-label={inputLabel}
        value={text ?? String(shown)}
        onChange={(e) => onText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        onFocus={(e) => { const el = e.currentTarget; el.select(); const vv = window.visualViewport; const fit = () => { if (document.activeElement === el) el.scrollIntoView({ block: "center" }); }; vv?.addEventListener("resize", fit); el.addEventListener("blur", () => vv?.removeEventListener("resize", fit), { once: true }); }}
      />
    </div>
  );
}

/**
 * Referral code on the quote: prefilled from the lulox-ref cookie (set by ?ref=
 * on any page) or ?ref= itself, editable, checked live against active
 * referrers. The server validates it again on send.
 */
export function useReferralCode() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ code: string; state: RefState } | null>(null);
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(REF_PARAM);
    const c = refFromCookie(document.cookie) ?? (fromUrl ? normalizeCode(fromUrl) : "");
    if (!c) return;
    const id = requestAnimationFrame(() => setCode(c));
    return () => cancelAnimationFrame(id);
  }, []);
  const norm = normalizeCode(code);
  const shape = checkCodeShape(norm);
  useEffect(() => {
    if (!shape.ok) return;
    const ctl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/referrals/check?code=${encodeURIComponent(norm)}`, { signal: ctl.signal });
        const j = (await r.json()) as { status?: string; active?: boolean };
        setResult({ code: norm, state: j.status === "taken" && j.active ? "ok" : "unknown" });
      } catch {
        /* aborted or offline: the server still checks on send */
      }
    }, 350);
    return () => { ctl.abort(); window.clearTimeout(t); };
  }, [norm, shape.ok]);
  const state: RefState = !norm ? "idle" : !shape.ok ? "invalid" : result?.code === norm ? result.state : "checking";
  return { code, setCode, norm, state };
}


export function Toggle({ on, set, label, sub, disabled, testId }: { on: boolean; set: (v: boolean) => void; label: string; sub: string; disabled?: boolean; testId?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} className="hire-toggle" onClick={() => set(!on)} data-testid={testId}>
      <span className="hire-toggle-knob" aria-hidden />
      <span className="hire-toggle-text">
        <span>{label}</span>
        <small>{sub}</small>
      </span>
    </button>
  );
}

