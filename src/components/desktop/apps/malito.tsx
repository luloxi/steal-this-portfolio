"use client";

import { useEffect, useState } from "react";
import { findContact, type Mail } from "@/desktop/model";
import { useDesk } from "@/components/desktop/store";
import { useLocale } from "@/i18n/locale-provider";

type Folder = Mail["folder"];

export function Malito() {
  const { state, dispatch } = useDesk();
  const { locale } = useLocale();
  const en = locale === "en";
  const [folder, setFolder] = useState<Folder>("inbox");
  const [id, setId] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const rows = state.mail.filter((m) => m.folder === folder);
  const open = state.mail.find((m) => m.id === id && m.folder === folder) ?? null;

  useEffect(() => {
    if (!id) return;
    dispatch({
      op: "set",
      recipe: (s) => {
        const mail = s.mail.find((m) => m.id === id);
        if (!mail || mail.read) return s;
        return { ...s, mail: s.mail.map((m) => (m.id === id ? { ...m, read: true } : m)) };
      },
    });
  }, [id, dispatch]);

  const folders: { id: Folder; es: string; en: string }[] = [
    { id: "inbox", es: "Bandeja", en: "Inbox" },
    { id: "sent", es: "Enviados", en: "Sent" },
    { id: "drafts", es: "Borradores", en: "Drafts" },
  ];

  return (
    <div className="dk-mail">
      <aside>
        {folders.map((item) => {
          const n = item.id === "inbox" ? state.mail.filter((m) => m.folder === "inbox" && !m.read).length : 0;
          return (
            <button
              key={item.id}
              type="button"
              className={folder === item.id ? "is-on" : ""}
              onClick={() => {
                setFolder(item.id);
                setCompose(false);
                setId(null);
              }}
            >
              {en ? item.en : item.es}
              {n ? <em>{n}</em> : null}
            </button>
          );
        })}
        <button type="button" onClick={() => { setCompose(true); setId(null); }}>
          {en ? "Write" : "Escribir"}
        </button>
        <p className="dk-muted">{en ? "Contacts are Garpen's." : "Los contactos son los de Garpen."}</p>
      </aside>
      <ul className="dk-list">
        {rows.map((m) => (
          <li key={m.id}>
            <button type="button" className={`${id === m.id ? "is-on" : ""} ${m.read ? "" : "is-unread"}`} onClick={() => { setId(m.id); setCompose(false); }}>
              <strong>{folder === "sent" ? m.to : m.from}</strong>
              <span>{m.subject}</span>
              <em className="dk-muted">{m.at}</em>
            </button>
          </li>
        ))}
        {rows.length === 0 ? <li className="dk-muted">{en ? "Empty." : "Vacío."}</li> : null}
      </ul>
      <article>
        {compose ? <Composer en={en} onDone={() => { setCompose(false); setFolder("sent"); }} /> : null}
        {!compose && open ? (
          <>
            <header>
              <h2>{open.subject}</h2>
              <p className="dk-muted">{en ? "From" : "De"} {open.from} · {en ? "To" : "Para"} {open.to} · {open.at}</p>
            </header>
            <p className="dk-body">{open.body}</p>
            <button
              type="button"
              onClick={() => {
                setCompose(true);
              }}
            >
              {en ? "Reply" : "Responder"}
            </button>
          </>
        ) : null}
        {!compose && !open ? <p className="dk-muted">{en ? "Pick a message." : "Elegí un mensaje."}</p> : null}
      </article>
    </div>
  );
}

function Composer({ en, onDone }: { en: boolean; onDone: () => void }) {
  const { state, dispatch } = useDesk();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  return (
    <form
      className="dk-form"
      onSubmit={(e) => {
        e.preventDefault();
        const contact = findContact(state.contacts, to);
        dispatch({ op: "mailSend", to: contact?.name || to, subject, body });
        onDone();
      }}
    >
      <label>
        {en ? "To" : "Para"}
        <input list="malito-contacts" value={to} onChange={(e) => setTo(e.target.value)} required aria-label={en ? "To" : "Para"} />
        <datalist id="malito-contacts">
          {state.contacts.map((c) => (
            <option key={c.id} value={c.name}>{c.email}</option>
          ))}
        </datalist>
      </label>
      <label>
        {en ? "Subject" : "Asunto"}
        <input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label={en ? "Subject" : "Asunto"} />
      </label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={8} aria-label={en ? "Message" : "Mensaje"} />
      <button type="submit">{en ? "Send" : "Enviar"}</button>
    </form>
  );
}
