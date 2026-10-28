"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { REFERRAL_PCT, formatCents, parseAmountCents, payoutCents, waLink, type Currency, type PayoutStatus, type Totals } from "@/lib/referrals";
import type { Lead, ReferrerWithLeads } from "@/lib/referrals-db";

/** /admin/referidos: the owner's register (Spanish only). */
const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });
};

function owed(t: Totals): string {
  const parts = (["USD", "ARS"] as Currency[]).filter((c) => t[c].pending > 0).map((c) => formatCents(t[c].pending, c));
  return parts.length ? parts.join(" + ") : "nada";
}

function paidTotal(t: Totals): string {
  const parts = (["USD", "ARS"] as Currency[]).filter((c) => t[c].paid > 0).map((c) => formatCents(t[c].paid, c));
  return parts.length ? parts.join(" + ") : "nada";
}

export function ReferralsAdmin({ referrers, loadError }: { referrers: ReferrerWithLeads[]; loadError: boolean }) {
  const totals = useMemo(() => {
    const t: Totals = { ARS: { pending: 0, paid: 0 }, USD: { pending: 0, paid: 0 } };
    for (const r of referrers) for (const c of ["ARS", "USD"] as Currency[]) {
      t[c].pending += r.totals[c].pending;
      t[c].paid += r.totals[c].paid;
    }
    return t;
  }, [referrers]);
  return (
    <PageShell title="Referidos">
      <div className="radm" data-testid="ref-admin">
        {loadError ? <p className="ref-error">No se pudo leer D1 (¿falta la migración 0009?).</p> : null}
        <p className="ref-sub">
          {referrers.length} referidos · Por pagar: <strong data-testid="radm-owed-all">{owed(totals)}</strong> · Pagado: {paidTotal(totals)}
        </p>
        {referrers.length === 0 && !loadError ? <p className="ref-hint">Todavía no hay referidos.</p> : null}
        {referrers.map((r) => (
          <ReferrerCard key={r.id} r={r} />
        ))}
      </div>
    </PageShell>
  );
}

function ReferrerCard({ r }: { r: ReferrerWithLeads }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const active = r.active === 1;
  const wa = waLink(r.whatsapp, `Hola ${r.name.split(" ")[0]}! Te escribo por tus referidos de lulox.com.ar.`);
  const toggle = async () => {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/admin/referrals/${encodeURIComponent(r.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) router.refresh();
    else setErr("No se pudo guardar.");
  };
  return (
    <section className="radm-card" data-active={active} data-testid={`radm-${r.code}`}>
      <header className="radm-head">
        <div className="radm-who">
          <h2 className="radm-name">
            {r.name} <code className="radm-code">{r.code}</code>
            {!active ? <span className="radm-badge">en pausa</span> : null}
          </h2>
          <p className="radm-meta">
            {r.email}
            {r.whatsapp ? ` · ${r.whatsapp}` : ""} · desde {fmtDate(r.created_at)}
          </p>
        </div>
        <div className="radm-owed">
          <span>Le debés</span>
          <strong data-testid={`radm-owed-${r.code}`}>{owed(r.totals)}</strong>
          <small>Pagado: {paidTotal(r.totals)}</small>
        </div>
      </header>
      <div className="radm-actions">
        <a className="radm-btn" href={`mailto:${r.email}?subject=${encodeURIComponent("Tus referidos en lulox.com.ar")}`}>
          Email
        </a>
        {wa ? (
          <a className="radm-btn" href={wa} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        ) : null}
        <button type="button" className="radm-btn radm-toggle" disabled={busy} onClick={toggle} data-testid={`radm-toggle-${r.code}`}>
          {active ? "Desactivar" : "Reactivar"}
        </button>
        {err ? <span className="ref-error">{err}</span> : null}
      </div>
      {r.leads.length ? (
        <ul className="radm-leads">
          {r.leads.map((l) => (
            <LeadRow key={l.id} l={l} />
          ))}
        </ul>
      ) : (
        <p className="ref-hint">Sin clientes todavía.</p>
      )}
    </section>
  );
}

function LeadRow({ l }: { l: Lead }) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>(l.payout?.currency ?? "USD");
  const [amount, setAmount] = useState(l.payout ? String(l.payout.amount_cents / 100) : "");
  const [status, setStatus] = useState<PayoutStatus>(l.payout?.status ?? "pending");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const cents = parseAmountCents(amount);
  const preview = cents !== null ? formatCents(payoutCents(cents), currency) : "";
  const save = async (nextStatus: PayoutStatus = status) => {
    if (cents === null) {
      setMsg("Monto inválido.");
      return;
    }
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/admin/referrals/leads/${encodeURIComponent(l.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency, amount, status: nextStatus }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setStatus(nextStatus);
      setMsg("Guardado");
      router.refresh();
    } else setMsg("No se pudo guardar.");
  };
  return (
    <li className="radm-lead" data-testid={`radm-lead-${l.id}`}>
      <div className="radm-lead-head">
        <strong>{l.name}</strong>
        <span className="radm-meta">
          {l.email} · {fmtDate(l.created_at)} · presupuesto US$ {l.total_usd.toLocaleString("en-US")}
        </span>
        {l.message ? <p className="radm-msg">{l.message}</p> : null}
      </div>
      <div className="radm-pay">
        <div className="radm-field">
          <span>Abonó</span>
          <span className="radm-amount">
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} aria-label="Moneda">
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
            <input type="text" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Monto que abonó el cliente" />
          </span>
        </div>
        <div className="radm-field">
          <span>{REFERRAL_PCT}% a pagar</span>
          <strong className="radm-payout" data-testid={`radm-payout-${l.id}`}>{preview || "-"}</strong>
        </div>
        <div className="radm-field">
          <span>Estado</span>
          <strong className="radm-status" data-status={l.payout ? status : "none"}>
            {!l.payout ? "sin monto" : status === "paid" ? `pagado ${fmtDate(l.payout.paid_at)}` : "pendiente"}
          </strong>
        </div>
        <div className="radm-pay-actions">
          <button type="button" className="radm-btn" disabled={busy || cents === null} onClick={() => save()}>
            Guardar
          </button>
          {l.payout ? (
            <button type="button" className="radm-btn radm-toggle" disabled={busy || cents === null} onClick={() => save(status === "paid" ? "pending" : "paid")} data-testid={`radm-mark-${l.id}`}>
              {status === "paid" ? "Marcar pendiente" : "Marcar pagado"}
            </button>
          ) : null}
          {msg ? <span className="radm-note" role="status">{msg}</span> : null}
        </div>
      </div>
    </li>
  );
}
