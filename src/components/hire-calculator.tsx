"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { turnstileSiteKey } from "@/content/site";
import { useSiteSettings } from "@/components/site-settings-context";
import { useSectionShown } from "@/components/site-order-context";
import { useLocale } from "@/i18n/locale-provider";
import { MagicHr } from "@/components/magic-hr";
import { clampHours, clampProjectDays, depositPct, discountSteps, estimate, hoursDigits, PRICING, projectBreakdown, type Complexity, type Mode, type Pricing } from "@/lib/pricing";
import { useEditMode } from "@/components/admin-context";
import { PricingAdmin } from "@/components/pricing-admin";
import { charCount, clampMessage, MAX_MESSAGE } from "@/lib/hire-limits";
import { LimitModal } from "@/components/limit-modal";
import { checkCodeShape, normalizeCode, REF_PARAM, refFromCookie, CODE_MAX } from "@/lib/referrals";

const copy = {
  es: {
    mode: "Modalidad",
    modes: { project: "Varios días", hourly: "Un día" } as Record<Mode, string>,
    hours: "Horas estimadas",
    hoursInput: (min: number, max: number) => `Horas, de ${min} a ${max}`,
    projectDays: "Días",
    daysInput: (min: number, max: number) => `Días, de ${min} a ${max}`,
    perDay: "Horas por día",
    perDayInput: (min: number, max: number) => `Horas por día, de ${min} a ${max}`,
    limits: (days: number, hours: number) => `De 1 a ${days} días, y de 1 a ${hours} h por día.`,
    complexity: "Complejidad",
    cx: {
      low: ["Baja", "Lo liviano: consultas, consejos y cosas que resuelvo tranqui."],
      medium: ["Media", "Le pongo foco de verdad, pero sin salir a investigar."],
      high: ["Alta", "Toda mi atención, y me pongo a investigar a fondo."],
    } as Record<Complexity, [string, string]>,
    conditions: "Condiciones",
    onSite: "Presencial",
    projectOnSite: "Requiere presencialidad",
    days: "Días presenciales",
    dayUnit: ["día", "días"],
    travel: "Viático*",
    travelNote: "*El viático puede variar según la distancia.",
    extra: "Urgencia",
    extraDays: "Días de urgencia",
    privateUse: "Uso privado",
    privateUseSub: "Por defecto puedo mostrar el trabajo en mi portfolio y el código queda open source. Con esta opción queda solo para vos.",
    lines: { work: "Trabajo", discount: "Descuento por volumen", onSite: "Recargo presencial", travel: "Viático*", extra: "Urgencia", private: "Uso privado" },
    estimate: "Estimación",
    total: "Total estimado",
    deposit: (pct: number) => `Anticipo (${pct}%)`,
    perHour: "/h",
    note: (pct: number, days: number) =>
      `Estimación orientativa, no es un presupuesto final. Lo ajustamos juntos en la llamada. Presupuestos válidos ${days} días; ${pct >= 100 ? "100% por adelantado." : pct <= 0 ? "todo contra entrega." : `${pct}% de anticipo y ${100 - pct}% contra entrega.`}`,
    formula: "Cómo calculo",
    fProject: (steps: [number, number][]) =>
      `(días × horas/día × complejidad${steps.length ? ` − descuento por tamaño: ${steps.map(([h, p]) => `${h} h ${p}%`).join(", ")}` : ""}) + presencial/día + viático/día + (urgencia × día) + uso privado`,
    fHourly: "(horas × complejidad) + presencial + viático + urgencia + uso privado",
    cta: "Videollamada",
    contact: "Contacto",
    ref: { label: "Código de referido (opcional)", by: "Referido por", checking: "Buscando el código…", unknown: "No encontramos ese código activo.", invalid: "Letras, números y guiones, de 3 a 24." },
    form: { name: "Nombre", email: "Tu email", message: "Mensaje", ph: "Contame qué necesitás…", budget: "Presupuesto que se envía", send: "Enviar", sending: "Enviando…", limitTitle: "Máximo 280 caracteres", limitClose: "Entendido", agents: "Formulario de contacto: nombre, email y mensaje (hasta 280 caracteres). Para enviarlo hay que pasar la verificación de Cloudflare Turnstile.",  ok: "¡Listo! Te respondo a tu email.", err: { invalid_name: "Falta tu nombre.", invalid_email: "Revisá el email.", invalid_message: "El mensaje debe tener entre 1 y 280 caracteres.", rate_limited: "Demasiados envíos. Probá en un rato.", captcha_failed: "Falta la verificación anti-bots. Esperá el tilde y probá de nuevo.", default: "No se pudo enviar. Probá de nuevo." } as Record<string, string>, yes: "sí", no: "no" },
  },
  en: {
    mode: "Engagement",
    modes: { project: "Several days", hourly: "One day" } as Record<Mode, string>,
    hours: "Estimated hours",
    hoursInput: (min: number, max: number) => `Hours, ${min} to ${max}`,
    projectDays: "Days",
    daysInput: (min: number, max: number) => `Days, ${min} to ${max}`,
    perDay: "Hours per day",
    perDayInput: (min: number, max: number) => `Hours per day, ${min} to ${max}`,
    limits: (days: number, hours: number) => `1 to ${days} days, and 1 to ${hours} h per day.`,
    complexity: "Complexity",
    cx: {
      low: ["Low", "The light stuff: questions, advice and things I handle calmly."],
      medium: ["Medium", "Real focus from me, no research needed."],
      high: ["High", "My full attention, plus digging into research."],
    } as Record<Complexity, [string, string]>,
    conditions: "Conditions",
    onSite: "On-site",
    projectOnSite: "Requires on-site work",
    days: "On-site days",
    dayUnit: ["day", "days"],
    travel: "Travel*",
    travelNote: "*Travel may vary with distance.",
    extra: "Urgency",
    extraDays: "Urgency days",
    privateUse: "Private use",
    privateUseSub: "By default I can show the work in my portfolio and the code stays open source. With this option it's just for you.",
    lines: { work: "Work", discount: "Volume discount", onSite: "On-site surcharge", travel: "Travel*", extra: "Urgency", private: "Private use" },
    estimate: "Estimate",
    total: "Estimated total",
    deposit: (pct: number) => `Deposit (${pct}%)`,
    perHour: "/h",
    note: (pct: number, days: number) =>
      `Ballpark estimate, not a final quote. We fine-tune it together on the call. Quotes are valid for ${days} days; ${pct >= 100 ? "100% upfront." : pct <= 0 ? "everything on delivery." : `${pct}% upfront, ${100 - pct}% on delivery.`}`,
    formula: "How I calculate",
    fProject: (steps: [number, number][]) =>
      `(days × hours/day × complexity${steps.length ? ` − size discount: ${steps.map(([h, p]) => `${h} h ${p}%`).join(", ")}` : ""}) + on-site/day + travel/day + (urgency × day) + private use`,
    fHourly: "(hours × complexity) + on-site + travel + urgency + private use",
    cta: "Video call",
    contact: "Contact",
    ref: { label: "Referral code (optional)", by: "Referred by", checking: "Looking up the code…", unknown: "We couldn't find that active code.", invalid: "Letters, numbers and hyphens, 3 to 24." },
    form: { name: "Name", email: "Your email", message: "Message", ph: "Tell me what you need…", budget: "Quote that will be sent", send: "Send", sending: "Sending…", limitTitle: "280 characters max", limitClose: "Got it", agents: "Contact form: name, email and message (up to 280 characters). Sending it requires passing the Cloudflare Turnstile check.",  ok: "Done! I'll reply to your email.", err: { invalid_name: "Your name is missing.", invalid_email: "Check the email.", invalid_message: "Message must be 1–280 characters.", rate_limited: "Too many sends. Try again later.", captcha_failed: "Anti-bot check missing. Wait for the checkmark and try again.", default: "Couldn't send. Try again." } as Record<string, string>, yes: "yes", no: "no" },
  },
};

const money = (n: number) => `${n < 0 ? "-" : ""}US$ ${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

function useCountUp(value: number) {
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
function QtySlider({ min, max, value, onChange, ariaLabel, inputLabel, clamp }: {
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
function useReferralCode() {
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

export function HireCalculator({ pricing = PRICING }: { pricing?: Pricing }) {
  const { locale, href } = useLocale();
  const settings = useSiteSettings();
  const editOn = useEditMode();
  // Stored amounts from the server (D1 over the code defaults); the admin panel swaps them after a save.
  const [P, setP] = useState(pricing);
  useEffect(() => setP(pricing), [pricing]); // eslint-disable-line react-hooks/set-state-in-effect -- sync with server props after router.refresh()
  // The amounts panel only renders after mount, once the saved edit-mode preference is applied
  // (never in the server HTML, so edit mode off never flashes it).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const contactShown = useSectionShown("contact");
  const c = copy[locale === "en" ? "en" : "es"];
  const [mode, setMode] = useState<Mode>(PRICING.defaults.mode);
  const [hourlyHours, setHourlyHours] = useState(PRICING.defaults.hourly.hours);
  const [projectDays, setProjectDays] = useState(PRICING.defaults.project.days);
  const [hoursPerDay, setHoursPerDay] = useState(PRICING.defaults.project.hoursPerDay);
  const [complexity, setComplexity] = useState<Complexity>(PRICING.defaults.project.complexity);
  const [onSite, setOnSite] = useState(false);
  const [onSiteDays, setOnSiteDays] = useState(1);
  const [extra, setExtra] = useState(false);
  const [extraDays, setExtraDays] = useState(1);
  const [privateUse, setPrivateUse] = useState(false);
  const ref = useReferralCode();

  const onSiteCap = Math.min(PRICING.maxOnSiteDays, mode === "project" ? projectDays : 1);
  const urgencyCap = Math.min(PRICING.maxUrgencyDays, mode === "project" ? projectDays : 1);
  const shownOnSiteDays = Math.max(1, Math.min(onSiteCap, onSiteDays));
  const shownExtraDays = Math.max(1, Math.min(urgencyCap, extraDays));
  const hours = mode === "project" ? projectDays * hoursPerDay : hourlyHours;
  const r = estimate({
    mode,
    hours,
    days: mode === "project" ? projectDays : undefined,
    hoursPerDay: mode === "project" ? hoursPerDay : undefined,
    complexity,
    extra,
    onSite,
    onSiteDays: shownOnSiteDays,
    extraDays: shownExtraDays,
    privateUse,
  }, P);
  const depPct = depositPct(P);
  const total = useCountUp(r.total);

  const setDays = (n: number) => {
    const next = clampProjectDays(n, PRICING.maxProjectDays);
    setProjectDays(next);
    const siteCap = Math.min(PRICING.maxOnSiteDays, next);
    const urgCap = Math.min(PRICING.maxUrgencyDays, next);
    setOnSiteDays((d) => Math.min(Math.max(1, d), siteCap));
    setExtraDays((d) => Math.min(Math.max(1, d), urgCap));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === "hourly") setHourlyHours(PRICING.defaults.hourly.hours);
    else {
      setProjectDays(PRICING.defaults.project.days);
      setHoursPerDay(PRICING.defaults.project.hoursPerDay);
    }
  };

  return (
    <div className="hire" data-mode={mode} data-cx={complexity}>
      {editOn && mounted ? <PricingAdmin pricing={P} onSaved={setP} /> : null}

      <fieldset className="hire-field">
        <legend className="hire-label">{c.mode}</legend>
        <div className="hire-seg" role="radiogroup" aria-label={c.mode}>
          {(["hourly", "project"] as Mode[]).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} className="hire-seg-btn" onClick={() => switchMode(m)}>
              {c.modes[m]}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === "hourly" ? (
        <fieldset className="hire-field">
          <legend className="hire-label">
            {c.hours} <output className="hire-hours">{hourlyHours}h</output>
          </legend>
          <QtySlider
            min={1}
            max={PRICING.maxHourlyHours}
            value={hourlyHours}
            onChange={setHourlyHours}
            ariaLabel={c.hours}
            inputLabel={c.hoursInput(1, PRICING.maxHourlyHours)}
            clamp={(n) => clampHours(n, PRICING.maxHourlyHours)}
          />
        </fieldset>
      ) : (
        <div className="hire-split">
          <fieldset className="hire-field">
            <legend className="hire-label">
              {c.projectDays} <output className="hire-hours">{projectDays}</output>
            </legend>
            <QtySlider
              min={1}
              max={PRICING.maxProjectDays}
              value={projectDays}
              onChange={setDays}
              ariaLabel={c.projectDays}
              inputLabel={c.daysInput(1, PRICING.maxProjectDays)}
              clamp={(n) => clampProjectDays(n, PRICING.maxProjectDays)}
            />
          </fieldset>
          <fieldset className="hire-field">
            <legend className="hire-label">
              {c.perDay} <output className="hire-hours">{hoursPerDay}h</output>
            </legend>
            <QtySlider
              min={1}
              max={PRICING.maxHourlyHours}
              value={hoursPerDay}
              onChange={(n) => setHoursPerDay(clampHours(n, PRICING.maxHourlyHours))}
              ariaLabel={c.perDay}
              inputLabel={c.perDayInput(1, PRICING.maxHourlyHours)}
              clamp={(n) => clampHours(n, PRICING.maxHourlyHours)}
            />
          </fieldset>
          <p className="hire-hint">{c.limits(PRICING.maxProjectDays, PRICING.maxHourlyHours)}</p>
        </div>
      )}

      <fieldset className="hire-field">
        <legend className="hire-label">{c.complexity}</legend>
        <div className="hire-cx" role="radiogroup" aria-label={c.complexity}>
          {(["low", "medium", "high"] as Complexity[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={complexity === k} className={`hire-cx-card hire-cx-${k}`} onClick={() => setComplexity(k)}>
              <span className="hire-cx-name">{c.cx[k][0]}</span>
              <span className="hire-cx-rate">US$ {P.rates[k]}{c.perHour}</span>
              <span className="hire-cx-desc">{c.cx[k][1]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="hire-field">
        <legend className="hire-label">{c.conditions}</legend>
        <div className="hire-toggles">
          <Toggle
            on={onSite}
            set={setOnSite}
            label={mode === "project" ? c.projectOnSite : c.onSite}
            sub={`+US$ ${P.onSiteSurcharge} · ${c.travel} +US$ ${P.travel}${mode === "project" ? ` / ${c.dayUnit[0]}` : ""}`}
          />
          {mode === "project" && onSite ? (
            <div className="hire-stepper" role="group" aria-label={c.days}>
              <span className="hire-stepper-label">{c.days}</span>
              <button type="button" aria-label="−" disabled={shownOnSiteDays <= 1} onClick={() => setOnSiteDays((d) => Math.max(1, Math.min(d, onSiteCap) - 1))}>−</button>
              <output aria-live="polite">{shownOnSiteDays}</output>
              <button type="button" aria-label="+" disabled={shownOnSiteDays >= onSiteCap} onClick={() => setOnSiteDays((d) => Math.min(onSiteCap, d + 1))}>+</button>
            </div>
          ) : null}
          <Toggle on={extra} set={setExtra} label={c.extra} sub={`+US$ ${P.extra}${mode === "project" ? ` × ${c.dayUnit[0]}` : ""}`} />
          {mode === "project" && extra ? (
            <div className="hire-stepper" role="group" aria-label={c.extraDays}>
              <span className="hire-stepper-label">{c.extraDays}</span>
              <button type="button" aria-label="−" disabled={shownExtraDays <= 1} onClick={() => setExtraDays((d) => Math.max(1, Math.min(d, urgencyCap) - 1))}>−</button>
              <output aria-live="polite">{shownExtraDays}</output>
              <button type="button" aria-label="+" disabled={shownExtraDays >= urgencyCap} onClick={() => setExtraDays((d) => Math.min(urgencyCap, d + 1))}>+</button>
            </div>
          ) : null}
          <Toggle on={privateUse} set={setPrivateUse} label={`${c.privateUse} (+US$ ${P.privateUse[mode]})`} sub={c.privateUseSub} testId="hire-private-use" />
        </div>
      </fieldset>

      <section className="hire-receipt" aria-live="polite">
        <div className="hire-receipt-top">
          <h3 className="hire-receipt-title">{c.estimate}</h3>
          <span className="hire-receipt-mode">{c.modes[mode]}</span>
        </div>
        {mode === "project" ? <p className="hire-breakdown">{projectBreakdown(projectDays, hoursPerDay, r.total, locale === "en" ? "en" : "es")}</p> : null}
        <ul className="hire-lines">
          {r.lines.map((l) => (
            <li key={l.id}>
              <span>
                {c.lines[l.id]}
                {l.id === "work" ? <em> {hours}h × US$ {P.rates[complexity]}</em> : null}
                {l.id === "discount" ? <em> -{l.pct}%</em> : null}
                {l.days && mode === "project" ? <em> {l.days} {c.dayUnit[l.days === 1 ? 0 : 1]} × US$ {l.amount / l.days}</em> : null}
              </span>
              <span>{money(l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="hire-total">
          <span>{c.total}</span>
          <strong>~{money(total)}</strong>
        </div>
        <div className="hire-deposit">
          <span>{c.deposit(depPct)}</span>
          <span>{money(r.deposit)}</span>
        </div>
        {r.lines.some((l) => l.id === "travel") ? <p className="hire-note">{c.travelNote}</p> : null}
        <p className="hire-note">{c.note(depPct, P.validityDays)}</p>
        <p className="hire-formula">
          <span>{c.formula}:</span>
          <code>{mode === "project" ? c.fProject(discountSteps(P)) : c.fHourly}</code>
        </p>
      </section>

      <div className="hire-ref" data-state={ref.state}>
        <label className="hire-form-field" htmlFor="hire-ref-code">
          <span>{c.ref.label}</span>
          <input
            id="hire-ref-code"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={CODE_MAX}
            value={ref.code}
            aria-describedby="hire-ref-status"
            onChange={(e) => ref.setCode(e.target.value.replace(/\s+/g, "").toLowerCase())}
          />
        </label>
        <p id="hire-ref-status" className="hire-ref-status" role="status" data-testid="hire-ref-status">
          {ref.state === "ok" ? (
            <>
              {c.ref.by}: <strong>{ref.norm}</strong>
            </>
          ) : ref.state === "checking" ? c.ref.checking : ref.state === "unknown" ? c.ref.unknown : ref.state === "invalid" ? c.ref.invalid : ""}
        </p>
      </div>

      <div className="hire-ctas">
        <HireForm
          c={c}
          budget={mode === "project"
            ? { mode, hours, days: projectDays, hoursPerDay, complexity, onSite, onSiteDays: onSite ? shownOnSiteDays : 0, extra, extraDays: extra ? shownExtraDays : 0, privateUse }
            : { mode, hours, complexity, onSite, onSiteDays: onSite ? 1 : 0, extra, extraDays: extra ? 1 : 0, privateUse }}
          refCode={ref.state === "ok" ? ref.norm : ""}
          rows={[
            [c.total, money(r.total)],
            [c.mode, c.modes[mode]],
            [c.hours, `${hours}h · ${c.cx[complexity][0]} (US$ ${P.rates[complexity]}${c.perHour})`],
            [c.onSite, onSite ? (mode === "project" ? `${c.form.yes}, ${shownOnSiteDays} ${c.dayUnit[shownOnSiteDays === 1 ? 0 : 1]}` : c.form.yes) : c.form.no],
            [c.extra, extra ? (mode === "project" ? `${c.form.yes}, ${shownExtraDays} ${c.dayUnit[shownExtraDays === 1 ? 0 : 1]}` : c.form.yes) : c.form.no],
            [c.privateUse, privateUse ? `${c.form.yes}, +US$ ${P.privateUse[mode]}` : c.form.no],
            ...(ref.state === "ok" ? [[c.ref.by, ref.norm] as [string, string]] : []),
          ]}
        />
        {settings.callBookingUrl || contactShown ? (
          <div className="hire-options">
            {settings.callBookingUrl ? (
              <a className="hire-act hire-act-call" href={settings.callBookingUrl} target="_blank" rel="noopener noreferrer" data-testid="hire-call-cta">
                {c.cta}
              </a>
            ) : null}
            {contactShown ? (
              <Link className="hire-act hire-act-contact" href={href("/contacto")} data-testid="hire-contact-cta">
                {c.contact}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

    </div>
  );
}

function Toggle({ on, set, label, sub, disabled, testId }: { on: boolean; set: (v: boolean) => void; label: string; sub: string; disabled?: boolean; testId?: string }) {
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

type Copy = (typeof copy)["es"];

function HireForm({ c, budget, rows, refCode }: { c: Copy; budget: Record<string, unknown>; rows: [string, string][]; refCode: string }) {
  const status = useRef<HTMLParagraphElement>(null);
  const f = c.form;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
        body: JSON.stringify({ name, email, message, website, budget, turnstileToken: token, refCode: refCode || undefined }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      resetTs(); // tokens are single-use
      if (res.ok && j.ok) {
        setState("ok");
        reveal();
        setMessage("");
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
      <label className="hire-hp" aria-hidden="true">
        Leave empty <input name="hire_hp" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>
      {/* Native (no-fetch) POST fallback: the server reads the same budget fields. */}
      {Object.entries(budget).map(([k, v]) => <input key={k} type="hidden" name={`budget.${k}`} value={String(v)} />)}
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
