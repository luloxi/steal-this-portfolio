"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { MagicHr } from "@/components/magic-hr";
import { useIsAdmin } from "@/components/admin-context";
import { GoogleSignInButton } from "@/components/views/sign-in-panel";
import { useLocale } from "@/i18n/locale-provider";
import { CODE_MAX, REFERRAL_PCT, checkCodeShape, formatCents, normalizeCode, type Currency, type Totals } from "@/lib/referrals";
import type { MyReferral } from "@/lib/referrals-db";

const PCT = `${REFERRAL_PCT}%`;

const COPY = {
  es: {
    lead: `Traé un cliente y quedate con el ${PCT} de lo que abone.`,
    sub: "Creá tu código, compartí tu link y listo: cada cliente que llegue con tu código suma para vos.",
    steps: [
      ["Creá tu código", "Uno corto y fácil de recordar, que sea tuyo."],
      ["Compartilo", "Pasá tu link: lleva a Contratar con tu código ya puesto."],
      [`Ganá el ${PCT}`, `Cuando tu cliente abona, te llevás el ${PCT} de lo que pagó.`],
    ],
    signIn: "Entrar con Google",
    signInHint: "Entrá con Google para crear tu código, compartir tu link y ver lo que vas sumando.",
    formTitle: "Creá tu código",
    name: "Nombre",
    email: "Email (de tu cuenta de Google)",
    whatsapp: "WhatsApp (opcional)",
    code: "Tu código",
    codeHint: "Letras, números y guiones, de 3 a 24.",
    status: { checking: "Buscando…", available: "¡Disponible!", taken: "Ya está en uso, probá otro.", reserved: "Esa palabra está reservada.", invalid: "Letras, números y guiones, de 3 a 24." },
    submit: "Crear mi código",
    sending: "Creando…",
    errors: {
      invalid_name: "Falta tu nombre.",
      invalid_whatsapp: "Revisá el WhatsApp (con código de país, por ejemplo +54 9 11 1234 5678).",
      code_invalid: "Letras, números y guiones, de 3 a 24.",
      code_reserved: "Esa palabra está reservada.",
      code_taken: "Ese código ya está en uso, probá otro.",
      already_has_code: "Tu cuenta ya tiene un código.",
      rate_limited: "Demasiados intentos. Probá en un rato.",
      sign_in_required: "Tu sesión se cerró. Ingresá de nuevo.",
      default: "No se pudo crear. Probá de nuevo.",
    } as Record<string, string>,
    yours: "Tu link",
    yoursEn: "En inglés",
    copy: "Copiar",
    copied: "¡Copiado!",
    yourCode: "Tu código",
    leads: "Clientes que trajiste",
    pending: "Por cobrar",
    paid: "Ya cobrado",
    paused: "Tu código está en pausa por ahora. Si querés reactivarlo, escribime.",
    quoteTip: "Tip: tu link abre Contratar con tu código ya puesto, listo para que tu cliente escriba.",
    quoteCta: "Abrir Contratar con mi código",
  },
  en: {
    lead: `Bring a client and keep ${PCT} of what they pay.`,
    sub: "Create your code, share your link and that's it: every client who comes with your code adds up for you.",
    steps: [
      ["Create your code", "Short, easy to remember, and yours."],
      ["Share it", "Send your link: it opens Hire me with your code already set."],
      [`Earn ${PCT}`, `When your client pays, you get ${PCT} of what they paid.`],
    ],
    signIn: "Sign in with Google",
    signInHint: "Sign in with Google to create your code, share your link and see what you've earned.",
    formTitle: "Create your code",
    name: "Name",
    email: "Email (from your Google account)",
    whatsapp: "WhatsApp (optional)",
    code: "Your code",
    codeHint: "Letters, numbers and hyphens, 3 to 24.",
    status: { checking: "Checking…", available: "Available!", taken: "Already taken, try another one.", reserved: "That word is reserved.", invalid: "Letters, numbers and hyphens, 3 to 24." },
    submit: "Create my code",
    sending: "Creating…",
    errors: {
      invalid_name: "Your name is missing.",
      invalid_whatsapp: "Check the WhatsApp number (with country code, e.g. +1 555 123 4567).",
      code_invalid: "Letters, numbers and hyphens, 3 to 24.",
      code_reserved: "That word is reserved.",
      code_taken: "That code is taken, try another one.",
      already_has_code: "Your account already has a code.",
      rate_limited: "Too many attempts. Try again later.",
      sign_in_required: "Your session ended. Sign in again.",
      default: "Couldn't create it. Try again.",
    } as Record<string, string>,
    yours: "Your link",
    yoursEn: "In Spanish",
    copy: "Copy",
    copied: "Copied!",
    yourCode: "Your code",
    leads: "Clients you brought",
    pending: "To collect",
    paid: "Collected",
    paused: "Your code is paused for now. Write me if you want it back on.",
    quoteTip: "Tip: your link opens Hire me with your code already set, ready for your client to write.",
    quoteCta: "Open Hire me with my code",
  },
};

type Copy = (typeof COPY)["es"];
type Links = { es: string; en: string };
type Avail = "idle" | "checking" | "available" | "taken" | "reserved" | "invalid";

export function ReferralsView({ viewer, mine, links }: { viewer: { name: string; email: string } | null; mine: MyReferral | null; links: Links | null }) {
  const { locale, href } = useLocale();
  const c = COPY[locale === "en" ? "en" : "es"];
  const pathname = usePathname();
  const [created, setCreated] = useState<{ code: string; links: Links } | null>(null);
  const title = locale === "en" ? "Referrals" : "Referidos";
  const isAdmin = useIsAdmin();

  const panel = mine
    ? { code: mine.referrer.code, links: links!, leads: mine.leads, totals: mine.totals, active: mine.referrer.active === 1 }
    : created
      ? { code: created.code, links: created.links, leads: 0, totals: null, active: true }
      : null;

  const steps = (
    <ol className="ref-steps">
      {c.steps.map(([h, p], i) => (
        <li key={h}>
          <span className="ref-step-n" aria-hidden>{i + 1}</span>
          <div>
            <strong>{h}</strong>
            <span>{p}</span>
          </div>
        </li>
      ))}
    </ol>
  );

  // Signed out: short pitch + the real Google button up top (no detour through /ingresar); steps below.
  if (!viewer && !panel) {
    return (
      <PageShell title={title}>
        <div className="ref" style={{ ["--cp-accent" as string]: "var(--section-referrals)" }}>
          <p className="ref-lead">{c.lead}</p>
          <div className="ref-signin" data-testid="ref-signin">
            <p className="ref-hint">{c.signInHint}</p>
            <GoogleSignInButton next={pathname || href("/referidos")} label={c.signIn} testId="ref-signin-google" />
          </div>
          <MagicHr />
          {steps}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={title}>
      <div className="ref" style={{ ["--cp-accent" as string]: "var(--section-referrals)" }}>
        <p className="ref-lead">{c.lead}</p>
        <p className="ref-sub">{c.sub}</p>
        {steps}
        {isAdmin ? (
          <Link className="radm-btn ref-admin-link" href="/admin/referidos" data-testid="ref-admin-link">
            {locale === "en" ? "Referral register (admin)" : "Registro de referidos (admin)"}
          </Link>
        ) : null}
        <MagicHr />
        {panel ? (
          <MyPanel c={c} {...panel} quoteHref={href("/contacto")} locale={locale === "en" ? "en" : "es"} />
        ) : (
          <SignupForm c={c} viewer={viewer!} onCreated={setCreated} />
        )}
      </div>
    </PageShell>
  );
}

function useAvailability(code: string) {
  const norm = normalizeCode(code);
  const shape = checkCodeShape(norm);
  const [res, setRes] = useState<{ code: string; status: Avail } | null>(null);
  useEffect(() => {
    if (!shape.ok) return;
    const ctl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/referrals/check?code=${encodeURIComponent(norm)}`, { signal: ctl.signal });
        const j = (await r.json()) as { status?: Avail };
        if (j.status) setRes({ code: norm, status: j.status });
      } catch {
        /* aborted */
      }
    }, 350);
    return () => {
      ctl.abort();
      window.clearTimeout(t);
    };
  }, [norm, shape.ok]);
  const status: Avail = !norm ? "idle" : !shape.ok ? shape.error : res?.code === norm ? res.status : "checking";
  return { norm, status };
}

function SignupForm({ c, viewer, onCreated }: { c: Copy; viewer: { name: string; email: string }; onCreated: (v: { code: string; links: Links }) => void }) {
  const router = useRouter();
  const [name, setName] = useState(viewer.name);
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [err, setErr] = useState("");
  const avail = useAvailability(code);
  const canSend = state !== "sending" && name.trim() !== "" && avail.status === "available";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setState("sending");
    setErr("");
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp, code: avail.norm }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; code?: string; links?: Links };
      if (res.ok && j.ok && j.code && j.links) {
        onCreated({ code: j.code, links: j.links });
        router.refresh();
        return;
      }
      if (j.error === "already_has_code") router.refresh();
      setState("error");
      setErr(c.errors[j.error ?? ""] ?? c.errors.default);
    } catch {
      setState("error");
      setErr(c.errors.default);
    }
  };

  return (
    <form className="ref-form" onSubmit={submit} data-testid="ref-form">
      <h2 className="ref-h2">{c.formTitle}</h2>
      <label className="hire-form-field" htmlFor="ref-name">
        <span>{c.name}</span>
        <input id="ref-name" name="name" type="text" required maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="hire-form-field" htmlFor="ref-email">
        <span>{c.email}</span>
        <input id="ref-email" name="email" type="email" value={viewer.email} readOnly aria-readonly="true" />
      </label>
      <label className="hire-form-field" htmlFor="ref-whatsapp">
        <span>{c.whatsapp}</span>
        <input id="ref-whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} placeholder="+54 9 11 1234 5678" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </label>
      <label className="hire-form-field" htmlFor="ref-code">
        <span>{c.code}</span>
        <span className="ref-code-input">
          <span className="ref-code-prefix" aria-hidden>?ref=</span>
          <input
            id="ref-code"
            name="code"
            type="text"
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={CODE_MAX}
            aria-describedby="ref-code-status"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s+/g, "-").toLowerCase())}
          />
        </span>
      </label>
      <p id="ref-code-status" className="ref-code-status" data-status={avail.status} role="status" data-testid="ref-code-status">
        {avail.status === "idle" ? c.codeHint : c.status[avail.status]}
      </p>
      <button type="submit" className="hire-btn ref-submit" disabled={!canSend}>
        {state === "sending" ? c.sending : c.submit}
        <span className="hire-btn-rainbow" aria-hidden />
      </button>
      {state === "error" ? <p className="ref-error" role="alert">{err}</p> : null}
    </form>
  );
}

function CopyButton({ text, c }: { text: string; c: Copy }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="ref-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? c.copied : c.copy}
    </button>
  );
}

function money(t: Totals | null, k: "pending" | "paid"): string {
  if (!t) return formatCents(0, "USD");
  const parts = (["USD", "ARS"] as Currency[]).filter((cur) => t[cur][k] > 0).map((cur) => formatCents(t[cur][k], cur));
  return parts.length ? parts.join(" · ") : formatCents(0, "USD");
}

function MyPanel({ c, code, links, leads, totals, active, quoteHref, locale }: { c: Copy; code: string; links: Links; leads: number; totals: Totals | null; active: boolean; quoteHref: string; locale: "es" | "en" }) {
  const main = locale === "en" ? links.en : links.es;
  const other = locale === "en" ? links.es : links.en;
  return (
    <div className="ref-panel" data-testid="ref-panel">
      {!active ? <p className="ref-paused" role="status">{c.paused}</p> : null}
      <p className="ref-code-line">
        {c.yourCode}: <strong data-testid="ref-my-code">{code}</strong>
      </p>
      <div className="ref-link-box">
        <span className="ref-label">{c.yours}</span>
        <div className="ref-link-row">
          <code className="ref-link" data-testid="ref-link">{main}</code>
          <CopyButton text={main} c={c} />
        </div>
        <span className="ref-label">{c.yoursEn}</span>
        <div className="ref-link-row">
          <code className="ref-link">{other}</code>
          <CopyButton text={other} c={c} />
        </div>
      </div>
      <dl className="ref-stats">
        <div>
          <dt>{c.leads}</dt>
          <dd data-testid="ref-leads">{leads}</dd>
        </div>
        <div>
          <dt>{c.pending}</dt>
          <dd data-testid="ref-pending">{money(totals, "pending")}</dd>
        </div>
        <div>
          <dt>{c.paid}</dt>
          <dd data-testid="ref-paid">{money(totals, "paid")}</dd>
        </div>
      </dl>
      <p className="ref-hint">{c.quoteTip}</p>
      <Link className="hire-act ref-quote" href={`${quoteHref}?ref=${encodeURIComponent(code)}`}>
        {c.quoteCta}
      </Link>
    </div>
  );
}
