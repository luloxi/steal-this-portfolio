"use client";

import { useMemo, useState } from "react";
import { isoDay, money, monthKey, parseTicket, settle, summarize, type TxKind } from "@/desktop/model";
import { useClock } from "@/components/desktop/clock";
import { useDesk } from "@/components/desktop/store";
import { useLocale } from "@/i18n/locale-provider";

type Tab = "move" | "debt" | "save" | "home" | "ticket" | "sum";

export function Tarask() {
  const { locale } = useLocale();
  const en = locale === "en";
  const [tab, setTab] = useState<Tab>("move");
  const tabs: { id: Tab; es: string; en: string }[] = [
    { id: "move", es: "Movimientos", en: "Cash" },
    { id: "debt", es: "Deuda", en: "Debt" },
    { id: "save", es: "Ahorros", en: "Savings" },
    { id: "home", es: "Hogares", en: "Households" },
    { id: "ticket", es: "Ticket", en: "Ticket" },
    { id: "sum", es: "Resumen", en: "Summary" },
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
      {tab === "move" ? <Moves en={en} /> : null}
      {tab === "debt" ? <Debts en={en} /> : null}
      {tab === "save" ? <Savings en={en} /> : null}
      {tab === "home" ? <Homes en={en} /> : null}
      {tab === "ticket" ? <Ticket en={en} /> : null}
      {tab === "sum" ? <Summary en={en} /> : null}
    </div>
  );
}

function Moves({ en }: { en: boolean }) {
  const { state, dispatch } = useDesk();
  const [kind, setKind] = useState<TxKind>("expense");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const rows = state.txs.filter((t) => t.kind !== "savings");
  return (
    <div>
      <form
        className="dk-form dk-inline"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount.replace(/\./g, "").replace(",", "."));
          if (!(n > 0)) return;
          dispatch({ op: "tx", kind, amount: n, memo: memo || (kind === "income" ? (en ? "Income" : "Ingreso") : en ? "Expense" : "Gasto"), currency });
          setAmount("");
          setMemo("");
        }}
      >
        <select value={kind} onChange={(e) => setKind(e.target.value === "income" ? "income" : "expense")} aria-label={en ? "Kind" : "Tipo"}>
          <option value="expense">{en ? "Expense" : "Gasto"}</option>
          <option value="income">{en ? "Income" : "Ingreso"}</option>
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value === "USD" ? "USD" : "ARS")} aria-label={en ? "Currency" : "Moneda"}>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={en ? "Amount" : "Monto"} aria-label={en ? "Amount" : "Monto"} />
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={en ? "What" : "Qué"} aria-label={en ? "Memo" : "Detalle"} />
        <button type="submit">{en ? "Add" : "Cargar"}</button>
      </form>
      <ul className="dk-list">
        {rows.map((t) => (
          <li key={t.id}>
            <span>
              {t.memo} <em className="dk-muted">{t.category} · {t.at}</em>
            </span>
            <strong className={t.kind === "expense" ? "is-out" : "is-in"}>
              {t.kind === "expense" ? "−" : "+"}
              {money(t.amount, t.currency)}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Debts({ en }: { en: boolean }) {
  const { state, dispatch } = useDesk();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [pay, setPay] = useState<Record<string, string>>({});
  return (
    <div>
      <form
        className="dk-form dk-inline"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(balance.replace(",", "."));
          if (!name.trim() || !(n > 0)) return;
          dispatch({ op: "debtAdd", name, balance: n });
          setName("");
          setBalance("");
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={en ? "Name" : "Nombre"} aria-label={en ? "Debt name" : "Nombre de la deuda"} />
        <input inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder={en ? "Balance" : "Saldo"} aria-label={en ? "Balance" : "Saldo"} />
        <button type="submit">{en ? "Add" : "Agregar"}</button>
      </form>
      <ul className="dk-list">
        {state.debts.map((d) => (
          <li key={d.id}>
            <span>
              {d.name}
              <strong>{money(d.balance, d.currency)}</strong>
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number((pay[d.id] ?? "").replace(",", "."));
                if (!(n > 0)) return;
                dispatch({ op: "debtPay", name: d.name, amount: n });
                setPay({ ...pay, [d.id]: "" });
              }}
            >
              <input inputMode="decimal" value={pay[d.id] ?? ""} aria-label={en ? "Payment" : "Pago"} onChange={(e) => setPay({ ...pay, [d.id]: e.target.value })} placeholder={en ? "Pay" : "Pagar"} />
              <button type="submit">{en ? "Pay" : "Pagar"}</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Savings({ en }: { en: boolean }) {
  const { state, dispatch } = useDesk();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  return (
    <ul className="dk-list">
      {state.savings.map((goal) => {
        const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
        return (
          <li key={goal.id} className="dk-save">
            <div>
              <strong>{goal.name}</strong>
              <span className="dk-muted">{money(goal.current, goal.currency)} / {money(goal.target, goal.currency)}</span>
              <i className="dk-bar"><i style={{ width: `${pct}%` }} /></i>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number((amounts[goal.id] ?? "").replace(",", "."));
                if (!(n > 0)) return;
                dispatch({ op: "savingDeposit", name: goal.name, amount: n });
                setAmounts({ ...amounts, [goal.id]: "" });
              }}
            >
              <input inputMode="decimal" value={amounts[goal.id] ?? ""} aria-label={en ? "Deposit" : "Apartar"} onChange={(e) => setAmounts({ ...amounts, [goal.id]: e.target.value })} placeholder={en ? "Set aside" : "Apartar"} />
              <button type="submit">{en ? "Add" : "Sumar"}</button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

function Homes({ en }: { en: boolean }) {
  const { state, dispatch } = useDesk();
  const [homeId, setHomeId] = useState(state.households[0]?.id ?? "");
  const [payer, setPayer] = useState(state.households[0]?.members[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [member, setMember] = useState("");
  const home = state.households.find((h) => h.id === homeId) ?? state.households[0];
  const rows = state.shared.filter((s) => s.householdId === home?.id);
  const splits = useMemo(() => {
    if (!home) return [];
    return settle(
      home.members,
      rows.map((row) => ({ payerId: row.payerId, amount: row.amount, memberIds: home.members.map((m) => m.id) })),
    );
  }, [home, rows]);
  if (!home) return null;
  return (
    <div>
      <div className="dk-form dk-inline">
        <select
          value={home.id}
          aria-label={en ? "Household" : "Hogar"}
          onChange={(e) => {
            setHomeId(e.target.value);
            const next = state.households.find((h) => h.id === e.target.value);
            setPayer(next?.members[0]?.id ?? "");
          }}
        >
          {state.households.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        <form
          className="dk-inline"
          onSubmit={(e) => {
            e.preventDefault();
            const name = member.trim();
            if (!name) return;
            dispatch({
              op: "set",
              recipe: (s) => ({
                ...s,
                households: s.households.map((h) => (h.id === home.id ? { ...h, members: [...h.members, { id: crypto.randomUUID(), name }] } : h)),
              }),
            });
            setMember("");
          }}
        >
          <input value={member} onChange={(e) => setMember(e.target.value)} placeholder={en ? "Member" : "Integrante"} aria-label={en ? "Member" : "Integrante"} />
          <button type="submit">{en ? "Add" : "Sumar"}</button>
        </form>
      </div>
      <p className="dk-muted">{home.members.map((m) => m.name).join(", ")}</p>
      <form
        className="dk-form dk-inline"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount.replace(",", "."));
          if (!(n > 0)) return;
          const who = home.members.find((m) => m.id === payer);
          dispatch({ op: "houseExpense", household: home.name, payer: who?.name, amount: n, memo: memo || (en ? "Shared" : "Compartido") });
          setAmount("");
          setMemo("");
        }}
      >
        <select value={payer} onChange={(e) => setPayer(e.target.value)} aria-label={en ? "Who paid" : "Quién pagó"}>
          {home.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={en ? "Amount" : "Monto"} aria-label={en ? "Amount" : "Monto"} />
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={en ? "What" : "Qué"} aria-label={en ? "Memo" : "Detalle"} />
        <button type="submit">{en ? "Split" : "Repartir"}</button>
      </form>
      <ul className="dk-list">
        {rows.map((row) => {
          const who = home.members.find((m) => m.id === row.payerId);
          return (
            <li key={row.id}>
              <span>{row.memo} <em className="dk-muted">{who?.name} · {row.at}</em></span>
              <strong>{money(row.amount, row.currency)}</strong>
            </li>
          );
        })}
      </ul>
      <h3 className="dk-h">{en ? "Who owes whom" : "Quién le debe a quién"}</h3>
      {splits.length === 0 ? <p className="dk-muted">{en ? "Settled." : "Están a mano."}</p> : (
        <ul className="dk-list">
          {splits.map((row, i) => {
            const from = home.members.find((m) => m.id === row.fromId)?.name ?? row.fromId;
            const to = home.members.find((m) => m.id === row.toId)?.name ?? row.toId;
            return <li key={i}><span>{from} → {to}</span><strong>{money(row.amount)}</strong></li>;
          })}
        </ul>
      )}
    </div>
  );
}

function Ticket({ en }: { en: boolean }) {
  const { dispatch } = useDesk();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const read = text.trim() ? parseTicket(text) : null;
  return (
    <div className="dk-ticket">
      <p className="dk-muted">
        {en
          ? "Paste the ticket text. A photo can sit next to it: the reader uses the text, not the pixels."
          : "Pegá el texto del ticket. La foto queda al lado: la lectura usa el texto, no los píxeles."}
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} aria-label={en ? "Ticket text" : "Texto del ticket"} placeholder={"Kiosco\nTOTAL 2500"} />
      <label className="dk-file">
        {en ? "Attach photo" : "Adjuntar foto"}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </label>
      {fileName ? <p className="dk-muted">{fileName}</p> : null}
      {read ? (
        <div className="dk-card">
          <strong>{read.merchant}</strong>
          <span>{read.total == null ? (en ? "No total" : "Sin total") : money(read.total, read.currency)}</span>
          {read.date ? <span className="dk-muted">{read.date}</span> : null}
          <button
            type="button"
            disabled={read.total == null}
            onClick={() => {
              if (read.total == null) return;
              dispatch({
                op: "tx",
                kind: "expense",
                amount: read.total,
                memo: read.merchant || (en ? "Ticket" : "Ticket"),
                currency: read.currency,
                at: read.date ?? isoDay(Date.now()),
              });
              setText("");
              setFileName("");
            }}
          >
            {en ? "Save expense" : "Cargar gasto"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Summary({ en }: { en: boolean }) {
  const { state } = useDesk();
  const now = useClock();
  const text = summarize(state, now, en ? "en" : "es");
  const key = monthKey(now);
  const rows = state.txs.filter((t) => t.at.startsWith(key));
  return (
    <div>
      <p className="dk-summary">{text}</p>
      <ul className="dk-list">
        {rows.map((t) => (
          <li key={t.id}>
            <span>{t.memo}</span>
            <strong className={t.kind === "expense" ? "is-out" : "is-in"}>{money(t.amount, t.currency)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
