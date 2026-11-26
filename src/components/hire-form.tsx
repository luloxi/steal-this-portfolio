"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { turnstileSiteKey } from "@/content/site";
import { useLocale } from "@/i18n/locale-provider";
import { charCount, clampMessage, MAX_MESSAGE } from "@/lib/hire-limits";
import { normalizeCode, REF_PARAM, refFromCookie } from "@/lib/referrals";
import type { HireCopy } from "./hire-copy";

const noopSubscribe = () => () => {};

/** utm_* tags of the current URL (the home's Contactar link carries them over). */
function readUtm(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(search)) if (/^utm_[a-z0-9_]{1,40}$/.test(k) && v && v.length <= 120) out[k] = v;
  return out;
}

/**
 * Three fields and a send button. The message is capped at MAX_MESSAGE code points
 * (same rule as the server) with a live counter. Referral code and utm tags ride along
 * silently (cookie / URL); the server validates both.
 */
export function HireForm({ c, callUrl, idPrefix = "hire", compact = false, onInternalNav, initialMessage = "" }: { c: HireCopy; callUrl?: string; idPrefix?: string; compact?: boolean; onInternalNav?: () => void; initialMessage?: string }) {
  const f = c.form;
  const { href } = useLocale();
  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const messageId = `${idPrefix}-message`;
  const countId = `${idPrefix}-message-count`;
  const agentsId = `${idPrefix}-form-agents`;
  const panelId = `${idPrefix}-form-panel`;
  const status = useRef<HTMLParagraphElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(() => clampMessage(initialMessage));
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [err, setErr] = useState("");
  const search = useSyncExternalStore(noopSubscribe, () => window.location.search, () => "");
  const cookie = useSyncExternalStore(noopSubscribe, () => document.cookie, () => "");
  const utm = readUtm(search);
  const fromUrl = new URLSearchParams(search).get(REF_PARAM);
  const refCode = refFromCookie(cookie) ?? (fromUrl ? normalizeCode(fromUrl) : "");

  useEffect(() => {
    const res = new URLSearchParams(window.location.search).get("contacto");
    if (!res) return;
    const id = requestAnimationFrame(() => {
      if (res === "ok") setState("ok");
      else { setState("error"); setErr(f.err[res] ?? f.err.default); }
      document.getElementById(panelId)?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [f, panelId]);
  const { box: tsBox, token, reset: resetTs } = useTurnstile();
  const left = Math.max(0, MAX_MESSAGE - charCount(message));

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
        body: JSON.stringify({ name, email, message, website, utm, turnstileToken: token, refCode: refCode || undefined }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      resetTs(); // tokens are single-use
      if (res.ok && j.ok) {
        setState("ok");
        setMessage("");
      } else {
        setState("error");
        setErr(f.err[j.error ?? ""] ?? f.err.default);
      }
    } catch {
      setState("error");
      setErr(f.err.default);
    }
    reveal();
  };

  return (
    <div id={panelId} className="hire-form-panel" data-open="true">
      <form className={`hire-form${compact ? " is-compact" : ""}`} onSubmit={submit} data-testid={idPrefix === "hire" ? "hire-form" : `${idPrefix}-form`} method="post" action="/api/hire-contact" aria-describedby={agentsId}>
        <p id={agentsId} className="sr-only">{f.agents}</p>
        <div className="hire-form-row">
          <label className="hire-form-field" htmlFor={nameId}>
            <span>{f.name}</span>
            <input id={nameId} name="name" type="text" required maxLength={80} autoComplete="name" autoCapitalize="words" enterKeyHint="next" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="hire-form-field" htmlFor={emailId}>
            <span>{f.email}</span>
            <input id={emailId} name="email" required type="email" inputMode="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <label className="hire-form-field" htmlFor={messageId}>
          <span className="hire-form-msg-label">
            {f.message}
            <output id={countId} htmlFor={messageId} className={`hire-form-count${left === 0 ? " is-over" : left <= 50 ? " is-low" : ""}`} aria-live="polite">
              {left} <span className="sr-only">{f.left}</span>
            </output>
          </span>
          <textarea id={messageId} name="message" required rows={compact ? 4 : 5} autoComplete="off" placeholder={f.ph} value={message} aria-describedby={countId} onChange={(e) => setMessage(clampMessage(e.target.value))} />
        </label>
        {/* Honeypot: odd name so browsers never autofill it. */}
        <label className="hire-hp" aria-hidden="true">
          Leave empty <input name="hire_hp" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        {/* Native (no-fetch) POST fallback carries the same silent extras. */}
        {Object.entries(utm).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        {refCode ? <input type="hidden" name="ref_code" value={refCode} /> : null}
        <input type="hidden" name="next" value={href("/contacto")} />
        <div ref={tsBox} className="hire-turnstile" />
        <div className="hire-form-actions">
          <button type="submit" className="hire-btn hire-cta hire-form-send" disabled={state === "sending" || !message.trim() || !token} data-testid={idPrefix === "hire" ? "hire-send" : `${idPrefix}-send`}>
            <span className="hire-btn-label">{state === "sending" ? f.sending : f.send}</span>
          </button>
          <p ref={status} className="hire-form-status" role="status">{state === "ok" ? f.ok : state === "error" ? err : ""}</p>
        </div>
        <p className="hire-form-foot">
          {f.reply}{" "}
          <Link
            href={href("/privacidad")}
            className="hire-privacy"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              onInternalNav?.();
            }}
          >{f.privacy}</Link>
          {callUrl ? (
            <>
              {" "}
              <a href={callUrl} target="_blank" rel="noopener noreferrer" data-testid="hire-call-cta">{f.call}</a>
            </>
          ) : null}
        </p>
      </form>
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

/** Cloudflare Turnstile (managed, usually invisible to people). Renders with the page. */
function useTurnstile() {
  const box = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const [token, setToken] = useState("");
  useEffect(() => {
    if (id.current || !box.current) return;
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
  }, []);
  useEffect(() => () => { if (id.current) window.turnstile?.remove(id.current); }, []);
  const reset = () => {
    setToken("");
    if (id.current) window.turnstile?.reset(id.current);
  };
  return { box, token, reset };
}
