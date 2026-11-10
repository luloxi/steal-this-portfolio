"use client";

import { useState } from "react";
import { agendaTone, balance, findContact, isoDay, money, type Contact } from "@/desktop/model";
import { useClock } from "@/components/desktop/clock";
import { useDesk } from "@/components/desktop/store";
import { useLocale } from "@/i18n/locale-provider";

type Tab = "people" | "agenda" | "money" | "timer";

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function Garpen() {
  const { state } = useDesk();
  const { locale } = useLocale();
  const en = locale === "en";
  const [tab, setTab] = useState<Tab>("agenda");
  const now = useClock(state.timer.running ? 250 : 1000);
  const today = isoDay(now);

  const tabs: { id: Tab; es: string; en: string }[] = [
    { id: "people", es: "Contactos", en: "Contacts" },
    { id: "agenda", es: "Agenda", en: "Agenda" },
    { id: "money", es: "Finanzas", en: "Finances" },
    { id: "timer", es: "Timer", en: "Timer" },
  ];

  return (
    <div className="dk-app">
      <div className="dk-tabs" role="tablist">
        {tabs.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-on" : ""} onClick={() => setTab(item.id)}>
            {en ? item.en : item.es}
          </button>
        ))}
      </div>
      {tab === "people" ? <People en={en} /> : null}
      {tab === "agenda" ? <Agenda en={en} today={today} /> : null}
      {tab === "money" ? <Money en={en} /> : null}
      {tab === "timer" ? <Timer en={en} /> : null}
    </div>
  );
}

function People({ en }: { en: boolean }) {
  const { state, dispatch } = useDesk();
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [id, setId] = useState<string | null>(null);
  const selected = state.contacts.find((c) => c.id === id) ?? null;

  const saveNew = () => {
    if (!draft.name.trim()) return;
    dispatch({ op: "contactAdd", ...draft });
    setDraft({ name: "", email: "", phone: "", company: "", notes: "" });
  };

  const patch = (partial: Partial<Contact>) => {
    if (!selected) return;
    dispatch({
      op: "set",
      recipe: (s) => ({ ...s, contacts: s.contacts.map((c) => (c.id === selected.id ? { ...c, ...partial } : c)) }),
    });
  };

  return (
    <div className="dk-split">
      <div>
        <ul className="dk-list">
          {state.contacts.map((c) => (
            <li key={c.id}>
              <button type="button" className={id === c.id ? "is-on" : ""} onClick={() => setId(c.id)}>
                <strong>{c.name}</strong>
                <span className="dk-muted">{c.company || c.email}</span>
              </button>
            </li>
          ))}
        </ul>
        <form
          className="dk-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveNew();
          }}
        >
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={en ? "Name" : "Nombre"} aria-label={en ? "Name" : "Nombre"} />
          <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" aria-label="Email" />
          <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder={en ? "Phone" : "Teléfono"} aria-label={en ? "Phone" : "Teléfono"} />
          <input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder={en ? "Company" : "Empresa"} aria-label={en ? "Company" : "Empresa"} />
          <button type="submit">{en ? "Add" : "Agregar"}</button>
        </form>
      </div>
      {selected ? (
        <form className="dk-form" onSubmit={(e) => e.preventDefault()}>
          <input value={selected.name} aria-label={en ? "Name" : "Nombre"} onChange={(e) => patch({ name: e.target.value })} />
          <input value={selected.email} aria-label="Email" onChange={(e) => patch({ email: e.target.value })} />
          <input value={selected.phone} aria-label={en ? "Phone" : "Teléfono"} onChange={(e) => patch({ phone: e.target.value })} />
          <input value={selected.company} aria-label={en ? "Company" : "Empresa"} onChange={(e) => patch({ company: e.target.value })} />
          <textarea value={selected.notes} aria-label={en ? "Notes" : "Notas"} onChange={(e) => patch({ notes: e.target.value })} />
          <button
            type="button"
            className="dk-danger"
            onClick={() => {
              dispatch({ op: "set", recipe: (s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== selected.id) }) });
              setId(null);
            }}
          >
            {en ? "Remove" : "Quitar"}
          </button>
          <p className="dk-muted">{en ? "Malito uses this same list." : "Malito usa esta misma lista."}</p>
        </form>
      ) : (
        <p className="dk-muted">{en ? "Pick a contact." : "Elegí un contacto."}</p>
      )}
    </div>
  );
}

function Agenda({ en, today }: { en: boolean; today: string }) {
  const { state, dispatch } = useDesk();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(today);
  const [contactId, setContactId] = useState("");
  const rows = [...state.agenda].sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));
  return (
    <div>
      <form
        className="dk-form dk-inline"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const contact = state.contacts.find((c) => c.id === contactId);
          dispatch({ op: "agendaAdd", title, due, contactName: contact?.name });
          setTitle("");
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={en ? "Task" : "Tarea"} aria-label={en ? "Task" : "Tarea"} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label={en ? "Due" : "Fecha"} />
        <select value={contactId} onChange={(e) => setContactId(e.target.value)} aria-label={en ? "Contact" : "Contacto"}>
          <option value="">{en ? "No contact" : "Sin contacto"}</option>
          {state.contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit">{en ? "Add" : "Agregar"}</button>
      </form>
      <ul className="dk-agenda">
        {rows.map((item) => {
          const tone = agendaTone(item.due, item.done, today);
          const who = state.contacts.find((c) => c.id === item.contactId);
          return (
            <li key={item.id} className={`tone-${tone}`}>
              <button
                type="button"
                className="dk-check"
                aria-pressed={item.done}
                onClick={() =>
                  dispatch({
                    op: "set",
                    recipe: (s) => ({ ...s, agenda: s.agenda.map((a) => (a.id === item.id ? { ...a, done: !a.done } : a)) }),
                  })
                }
              >
                {item.done ? "✓" : ""}
              </button>
              <div>
                <strong>{item.title}</strong>
                <span className="dk-muted">
                  {item.due || (en ? "No date" : "Sin fecha")}
                  {who ? ` · ${who.name}` : ""}
                </span>
              </div>
              <i className={`dk-dot tone-${tone}`} title={tone} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Money({ en }: { en: boolean }) {
  const { state, dispatch } = useDesk();
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState<"in" | "out">("in");
  const [memo, setMemo] = useState("");
  return (
    <div>
      <div className="dk-accounts">
        {state.accounts.map((a) => (
          <article key={a.id}>
            <span>{a.name}</span>
            <strong>{money(balance(state, a.id), a.currency)}</strong>
          </article>
        ))}
      </div>
      <form
        className="dk-form dk-inline"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount.replace(",", "."));
          if (!(n > 0)) return;
          const account = state.accounts.find((a) => a.id === accountId);
          dispatch({ op: "movement", amount: n, memo: memo || (dir === "in" ? (en ? "In" : "Ingreso") : en ? "Out" : "Egreso"), dir, accountName: account?.name });
          setAmount("");
          setMemo("");
        }}
      >
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label={en ? "Account" : "Cuenta"}>
          {state.accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select value={dir} onChange={(e) => setDir(e.target.value === "out" ? "out" : "in")} aria-label={en ? "Direction" : "Tipo"}>
          <option value="in">{en ? "In" : "Ingreso"}</option>
          <option value="out">{en ? "Out" : "Egreso"}</option>
        </select>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={en ? "Amount" : "Monto"} aria-label={en ? "Amount" : "Monto"} />
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={en ? "Memo" : "Detalle"} aria-label={en ? "Memo" : "Detalle"} />
        <button type="submit">{en ? "Add" : "Cargar"}</button>
      </form>
      <ul className="dk-list">
        {state.movements.slice(0, 20).map((m) => {
          const account = state.accounts.find((a) => a.id === m.accountId);
          const who = findContact(state.contacts, state.contacts.find((c) => c.id === m.contactId)?.name ?? "");
          return (
            <li key={m.id}>
              <span>
                {m.memo} <em className="dk-muted">{account?.name}{who ? ` · ${who.name}` : ""} · {m.at}</em>
              </span>
              <strong className={m.amount < 0 ? "is-out" : "is-in"}>{money(m.amount, account?.currency)}</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Timer({ en }: { en: boolean }) {
  const { state, dispatch } = useDesk();
  const timer = state.timer;
  const now = useClock(timer.running ? 250 : 1000);
  const seconds = timer.running && timer.startedAt ? timer.base + (now - timer.startedAt) / 1000 : timer.base;
  const who = state.contacts.find((c) => c.id === timer.contactId);
  return (
    <div className="dk-timer">
      <p className="dk-timer-readout">{clock(seconds)}</p>
      <div className="dk-form dk-inline">
        <select
          value={timer.contactId}
          aria-label={en ? "Contact" : "Contacto"}
          onChange={(e) => dispatch({ op: "set", recipe: (s) => ({ ...s, timer: { ...s.timer, contactId: e.target.value } }) })}
        >
          <option value="">{en ? "No contact" : "Sin contacto"}</option>
          {state.contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label>
          {en ? "Rate / h" : "Tarifa / h"}
          <input
            inputMode="decimal"
            value={String(timer.rate)}
            aria-label={en ? "Hourly rate" : "Tarifa por hora"}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 0) dispatch({ op: "set", recipe: (s) => ({ ...s, timer: { ...s.timer, rate: n } }) });
            }}
          />
        </label>
        <label className="dk-checkline">
          <input
            type="checkbox"
            checked={timer.billable}
            onChange={(e) => dispatch({ op: "set", recipe: (s) => ({ ...s, timer: { ...s.timer, billable: e.target.checked } }) })}
          />
          {en ? "Billable" : "Facturable"}
        </label>
        {timer.running ? (
          <button type="button" onClick={() => dispatch({ op: "timer", action: "stop" })}>
            {en ? "Stop" : "Parar"}
          </button>
        ) : (
          <button type="button" onClick={() => dispatch({ op: "timer", action: "start", contactName: who?.name })}>
            {en ? "Start" : "Arrancar"}
          </button>
        )}
      </div>
      <ul className="dk-list">
        {state.entries.map((entry) => {
          const contact = state.contacts.find((c) => c.id === entry.contactId);
          const billed = entry.billable ? money(Math.round((entry.seconds / 3600) * entry.rate)) : en ? "not billed" : "no facturado";
          return (
            <li key={entry.id}>
              <span>
                {contact?.name || (en ? "No contact" : "Sin contacto")} · {clock(entry.seconds)} · {entry.at}
              </span>
              <strong>{billed}</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
