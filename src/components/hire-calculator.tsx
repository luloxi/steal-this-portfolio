"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSiteSettings } from "@/components/site-settings-context";
import { useSectionShown } from "@/components/site-order-context";
import { useLocale } from "@/i18n/locale-provider";
import { clampHours, clampProjectDays, depositPct, discountSteps, estimate, PRICING, projectBreakdown, type Complexity, type Mode, type Pricing } from "@/lib/pricing";
import { useEditMode } from "@/components/admin-context";
import { PricingAdmin } from "@/components/pricing-admin";
import { CODE_MAX } from "@/lib/referrals";
import { copy } from "./hire-copy";
import { QtySlider, Toggle, useCountUp, useReferralCode } from "./hire-widgets";
import { HireForm } from "./hire-form";

const money = (n: number) => `${n < 0 ? "-" : ""}US$ ${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

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

