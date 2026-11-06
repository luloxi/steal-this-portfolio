"use client";

import { useEffect, useRef, useState } from "react";
import { turnstileSiteKey } from "@/content/site";
import { MagicHr } from "@/components/magic-hr";
import { charCount, clampMessage, MAX_MESSAGE, MAX_SUBSIDY_REASON } from "@/lib/hire-limits";
import { LimitModal } from "@/components/limit-modal";
import type { Copy } from "./hire-copy";
import { Toggle } from "./hire-widgets";

export function HireForm({ c, budget, rows, refCode }: { c: Copy; budget: Record<string, unknown>; rows: [string, string][]; refCode: string }) {
  const status = useRef<HTMLParagraphElement>(null);
  const f = c.form;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subsidy, setSubsidy] = useState(false);
  const [subsidyReason, setSubsidyReason] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [err, setErr] = useState("");
  const [limitHit, setLimitHit] = useState<{ kind: "trimmed" | "limit"; nonce: number } | null>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const res = new URLSearchParams(window.location.search).get("contacto");
    if (!res) return;
    const id = requestAnimationFrame(() => {
      if (res === "ok") setState("ok");
      else { setState("error"); setErr(f.err[res] ?? f.err.default); }
      document.getElementById("hire-form-panel")?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [f]);
  const { box: tsBox, token, reset: resetTs } = useTurnstile(true);
  const used = charCount(message);
  const left = Math.max(0, MAX_MESSAGE - used);
  const atLimit = used >= MAX_MESSAGE;
  // Hard limit by code point (same as the server). No native maxLength: it counts UTF-16 units
  // (an emoji would count 2 there and 1 here). Going over or reaching it opens one modal; repeated
  // pastes restart that modal's countdown instead of stacking new ones.
  const onMessage = (v: string) => {
    const r = clampMessage(message, v);
    setMessage(r.value);
    if (r.event) { const kind = r.event; setLimitHit((h) => ({ kind, nonce: (h?.nonce ?? 0) + 1 })); }
  };
  const closeLimit = () => {
    setLimitHit(null);
    requestAnimationFrame(() => msgRef.current?.focus({ preventScroll: true }));
  };
  // Mobile: keep the focused field (and the limit alert under it) above the on-screen keyboard.
  const keepVisible = (e: React.FocusEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const vv = window.visualViewport;
    const fit = () => { if (document.activeElement === el) el.scrollIntoView({ block: "center" }); };
    vv?.addEventListener("resize", fit);
    el.addEventListener("blur", () => vv?.removeEventListener("resize", fit), { once: true });
  };

  const reveal = () =>
    requestAnimationFrame(() => status.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setErr("");
    try {
      const res = await fetch("/api/hire-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website, budget, subsidy, subsidyReason: subsidy ? subsidyReason : "", turnstileToken: token, refCode: refCode || undefined }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      resetTs(); // tokens are single-use
      if (res.ok && j.ok) {
        setState("ok");
        reveal();
        setMessage("");
        setSubsidy(false);
        setSubsidyReason("");
      } else {
        setState("error");
        setErr(f.err[j.error ?? ""] ?? f.err.default);
        reveal();
      }
    } catch {
      setState("error");
      setErr(f.err.default);
      reveal();
    }
  };

  return (
    <div id="hire-form-panel" className="hire-form-panel" data-open="true">
    <form className="hire-form" onSubmit={submit} data-testid="hire-form" method="post" action="/api/hire-contact" aria-describedby="hire-form-agents">
      <p id="hire-form-agents" className="sr-only">{f.agents}</p>
      <div className="hire-form-row">
        <label className="hire-form-field" htmlFor="hire-name">
          <span>{f.name}</span>
          <input id="hire-name" name="name" type="text" required maxLength={80} autoComplete="name" autoCapitalize="words" enterKeyHint="next" value={name} onFocus={keepVisible} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="hire-form-field" htmlFor="hire-email">
          <span>{f.email}</span>
          <input id="hire-email" name="email" required type="email" inputMode="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" maxLength={254} autoComplete="email" value={email} onFocus={keepVisible} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>
      <label className="hire-form-field" htmlFor="hire-message">
        <span className="hire-form-msg-label">
          {f.message} <output id="hire-message-count" htmlFor="hire-message" className={`hire-form-count${atLimit ? " is-over" : left <= 20 ? " is-low" : ""}`}>{left}</output>
        </span>
        <textarea ref={msgRef} id="hire-message" name="message" required rows={4} autoComplete="off" enterKeyHint="send" placeholder={f.ph} value={message} aria-describedby="hire-message-count" onFocus={keepVisible} onChange={(e) => onMessage(e.target.value)} />
      </label>
      {/* Honeypot: odd name so browsers never autofill it. */}
      <Toggle on={subsidy} set={setSubsidy} label={f.subsidy} sub={f.subsidySub} testId="hire-subsidy" />
      {subsidy ? (
        <label className="hire-form-field" htmlFor="hire-subsidy-reason">
          <span className="hire-form-msg-label">
            {f.subsidyReason} <output id="hire-subsidy-count" htmlFor="hire-subsidy-reason" className={`hire-form-count${charCount(subsidyReason) >= MAX_SUBSIDY_REASON ? " is-over" : MAX_SUBSIDY_REASON - charCount(subsidyReason) <= 20 ? " is-low" : ""}`}>{Math.max(0, MAX_SUBSIDY_REASON - charCount(subsidyReason))}</output>
          </span>
          <textarea id="hire-subsidy-reason" name="subsidy_reason" rows={3} autoComplete="off" placeholder={f.subsidyPh} value={subsidyReason} aria-describedby="hire-subsidy-count" onFocus={keepVisible} onChange={(e) => setSubsidyReason(clampMessage(subsidyReason, e.target.value, MAX_SUBSIDY_REASON).value)} />
        </label>
      ) : null}
      <label className="hire-hp" aria-hidden="true">
        Leave empty <input name="hire_hp" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>
      {/* Native (no-fetch) POST fallback: the server reads the same budget fields. */}
      {Object.entries(budget).map(([k, v]) => <input key={k} type="hidden" name={`budget.${k}`} value={String(v)} />)}
      <input type="hidden" name="subsidy" value={subsidy ? "true" : "false"} />
      {refCode ? <input type="hidden" name="ref_code" value={refCode} /> : null}
      <div className="hire-form-budget" role="group" aria-label={f.budget}>
        <span className="hire-form-budget-title">{f.budget}</span>
        <dl>
          {rows.map(([k, v], i) => (
            <div key={i} className={i === 0 ? "is-total" : undefined}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div>
            <dt>{f.subsidy}</dt>
            <dd>{subsidy ? (subsidyReason || f.yes) : f.no}</dd>
          </div>
        </dl>
      </div>
      <div ref={tsBox} className="hire-turnstile" />
      <MagicHr className="hire-form-hr" />
      <div className="hire-form-actions">
        <button type="submit" className="hire-btn hire-cta hire-form-send" disabled={state === "sending" || used === 0 || !token} data-testid="hire-send">
          <span className="hire-cta-paint" aria-hidden />
          <span className="hire-btn-label">{state === "sending" ? f.sending : f.send}</span>
        </button>
        <p ref={status} className="hire-form-status" role="status">{state === "ok" ? f.ok : state === "error" ? err : ""}</p>
      </div>
    </form>
    {limitHit ? (
      <LimitModal
        nonce={limitHit.nonce}
        title={f.limitTitle}
        close={f.limitClose}
        onClose={closeLimit}
      />
    ) : null}
    </div>
  );
}


type TurnstileApi = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window { turnstile?: TurnstileApi }
}

const TS_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let tsLoad: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  tsLoad ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const s = document.createElement("script");
    s.src = TS_SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    s.onerror = () => { tsLoad = null; reject(new Error("turnstile")); };
    document.head.appendChild(s);
  });
  return tsLoad;
}

/** Cloudflare Turnstile (managed). The form is open on load, so this renders with the page. */
function useTurnstile(active: boolean) {
  const box = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const [token, setToken] = useState("");
  useEffect(() => {
    if (!active || id.current || !box.current) return;
    let alive = true;
    loadTurnstile()
      .then((ts) => {
        if (!alive || !box.current || id.current) return;
        id.current = ts.render(box.current, {
          sitekey: turnstileSiteKey,
          theme: document.documentElement.classList.contains("light") ? "light" : "dark",
          language: document.documentElement.lang || "auto",
          size: "flexible",
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [active]);
  useEffect(() => () => { if (id.current) window.turnstile?.remove(id.current); }, []);
  const reset = () => {
    setToken("");
    if (id.current) window.turnstile?.reset(id.current);
  };
  return { box, token, reset };
}
