"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { PRICING, type Pricing } from "@/lib/pricing";
import { applyValues, maxFor, validatePricingPayload, valuesFrom, type PricingKey, type PricingValues } from "@/lib/pricing-settings";

type Unit = "usd/h" | "usd/day" | "usd" | "pct";
const GROUPS: { id: "rates" | "conditions" | "private" | "deposit" | "discounts"; fields: [PricingKey, Unit][] }[] = [
  { id: "rates", fields: [["rate_low", "usd/h"], ["rate_medium", "usd/h"], ["rate_high", "usd/h"]] },
  { id: "conditions", fields: [["on_site", "usd/day"], ["travel", "usd/day"], ["urgency", "usd/day"]] },
  { id: "private", fields: [["private_project", "usd"], ["private_hourly", "usd"]] },
  { id: "deposit", fields: [["deposit_pct", "pct"]] },
  { id: "discounts", fields: [["discount_s", "pct"], ["discount_m", "pct"], ["discount_l", "pct"]] },
];

const copy = {
  es: {
    title: "Montos",
    badge: "solo vos",
    hint: "Lo ves solo vos, con el modo edición. Al guardar, la calculadora, el mail y los leads usan estos montos.",
    groups: { rates: "Tarifa por hora", conditions: "Condiciones", private: "Uso privado", deposit: "Anticipo", discounts: "Descuento por tamaño" },
    fields: {
      rate_low: "Baja", rate_medium: "Media", rate_high: "Alta",
      on_site: "Presencial", travel: "Viático", urgency: "Urgencia",
      private_project: "Varios días", private_hourly: "Un día",
      deposit_pct: "Anticipo",
      discount_s: `Chico ${PRICING.sizes.s} h`, discount_m: `Mediano ${PRICING.sizes.m} h`, discount_l: `Grande ${PRICING.sizes.l} h`,
    } as Record<PricingKey, string>,
    unit: { "usd/h": "/h", "usd/day": "/día", usd: "", pct: "%" } as Record<Unit, string>,
    save: "Guardar",
    saving: "Guardando…",
    defaults: "Valores por defecto",
    saved: "Guardado. Ya se ve así en la calculadora.",
    dirty: "Cambios sin guardar.",
    err: {
      invalid_value: (f: string, max: number) => `Revisá "${f}": un número entero de 0 a ${max}.`,
      discounts_order: "Los descuentos no pueden bajar: Chico, Mediano y Grande de menor a mayor.",
      session: "Tu sesión venció. Volvé a ingresar.",
      forbidden: "Solo el admin puede cambiar los montos.",
      edit_mode_off: "Prendé el modo edición para guardar.",
      default: "No se pudo guardar. Probá de nuevo.",
    },
  },
  en: {
    title: "Amounts",
    badge: "only you",
    hint: "Only you see this, in edit mode. Once saved, the calculator, the email and the leads use these amounts.",
    groups: { rates: "Hourly rate", conditions: "Conditions", private: "Private use", deposit: "Deposit", discounts: "Size discount" },
    fields: {
      rate_low: "Low", rate_medium: "Medium", rate_high: "High",
      on_site: "On-site", travel: "Travel", urgency: "Urgency",
      private_project: "Several days", private_hourly: "One day",
      deposit_pct: "Deposit",
      discount_s: `Small ${PRICING.sizes.s} h`, discount_m: `Medium ${PRICING.sizes.m} h`, discount_l: `Large ${PRICING.sizes.l} h`,
    } as Record<PricingKey, string>,
    unit: { "usd/h": "/h", "usd/day": "/day", usd: "", pct: "%" } as Record<Unit, string>,
    save: "Save",
    saving: "Saving…",
    defaults: "Default values",
    saved: "Saved. The calculator shows it now.",
    dirty: "Unsaved changes.",
    err: {
      invalid_value: (f: string, max: number) => `Check "${f}": a whole number from 0 to ${max}.`,
      discounts_order: "Discounts can't go down: Small, Medium and Large from lowest to highest.",
      session: "Your session expired. Sign in again.",
      forbidden: "Only the admin can change the amounts.",
      edit_mode_off: "Turn edit mode on to save.",
      default: "Couldn't save. Try again.",
    },
  },
};

const toText = (v: PricingValues) => Object.fromEntries(Object.entries(v).map(([k, n]) => [k, String(n)])) as Record<PricingKey, string>;
const digits = (raw: string) => raw.split(/[.,]/)[0].replace(/\D+/g, "").replace(/^0+(?=\d)/, "").slice(0, 6);

/**
 * Compact amounts panel on /contratar (admin with edit mode on only). Edits
 * every PRICING_FIELDS value, validates like the server and saves to
 * PUT /api/pricing; the calculator switches to the new amounts right away.
 */
export function PricingAdmin({ pricing, onSaved }: { pricing: Pricing; onSaved: (p: Pricing) => void }) {
  const { locale } = useLocale();
  const c = copy[locale === "en" ? "en" : "es"];
  const router = useRouter();
  const saved = useMemo(() => valuesFrom(pricing), [pricing]);
  const [text, setText] = useState<Record<PricingKey, string>>(() => toText(saved));
  const [state, setState] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [badField, setBadField] = useState<string | null>(null);
  const status = useRef<HTMLParagraphElement>(null);
  // Keep the result line in view (on mobile the admin strip covers the bottom of the screen).
  const showStatus = () => requestAnimationFrame(() => status.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));

  const numbers = Object.fromEntries(Object.entries(text).map(([k, v]) => [k, v === "" ? NaN : Number(v)])) as PricingValues;
  const dirty = (Object.keys(saved) as PricingKey[]).some((k) => numbers[k] !== saved[k]);

  const fail = (error: string, field?: string) => {
    setState("error");
    setBadField(field ?? null);
    if (error === "invalid_value" && field) setMsg(c.err.invalid_value(c.fields[field as PricingKey] ?? field, maxFor(field as PricingKey)));
    else setMsg((c.err as Record<string, unknown>)[error] as string ?? c.err.default);
    showStatus();
  };

  const save = async () => {
    const v = validatePricingPayload({ values: numbers });
    if (!v.ok) return fail(v.error, v.field);
    setState("saving");
    setMsg("");
    setBadField(null);
    try {
      const res = await fetch("/api/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: v.values }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: string };
      if (!res.ok || !j.ok) return fail(res.status === 401 ? "session" : (j.error ?? "default"), j.field);
      onSaved(applyValues(v.values, pricing));
      setState("ok");
      setMsg(c.saved);
      showStatus();
      router.refresh(); // server render re-reads D1: labels, form and email all match
    } catch {
      fail("default");
    }
  };

  return (
    <details className="price-admin" data-testid="pricing-admin">
      <summary>
        <span className="price-admin-title">{c.title}</span>
        <span className="price-admin-badge">{c.badge}</span>
        {dirty ? <span className="price-admin-dot" aria-label={c.dirty} title={c.dirty} /> : null}
      </summary>
      <p className="price-admin-hint">{c.hint}</p>
      <div className="price-admin-groups">
        {GROUPS.map((g) => (
          <fieldset key={g.id} className="price-admin-group" data-group={g.id}>
            <legend>{c.groups[g.id]}</legend>
            {g.fields.map(([k, unit]) => (
              <label key={k} className="price-admin-field" data-bad={badField === k || (badField === "discount_m" && g.id === "discounts") || undefined}>
                <span className="price-admin-name">{c.fields[k]}</span>
                <span className="price-admin-box">
                  {unit !== "pct" ? <i aria-hidden>US$</i> : null}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    enterKeyHint="done"
                    data-key={k}
                    aria-label={`${c.groups[g.id]}: ${c.fields[k]}`}
                    value={text[k]}
                    onChange={(e) => { setText((t) => ({ ...t, [k]: digits(e.target.value) })); if (state !== "saving") setState("idle"); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void save(); } }}
                  />
                  {c.unit[unit] ? <i aria-hidden>{c.unit[unit]}</i> : null}
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="price-admin-actions">
        <p ref={status} className="price-admin-status" role="status" data-state={state}>{state === "ok" || state === "error" ? msg : dirty ? c.dirty : ""}</p>
        <button type="button" className="price-admin-btn" onClick={() => { setText(toText(valuesFrom(PRICING))); setState("idle"); setBadField(null); }} data-testid="pricing-defaults">
          {c.defaults}
        </button>
        <button type="button" className="price-admin-btn is-primary" disabled={state === "saving" || !dirty} onClick={() => void save()} data-testid="pricing-save">
          {state === "saving" ? c.saving : c.save}
        </button>
      </div>
    </details>
  );
}
