"use client";

import { useEffect, useState } from "react";
import { Tip } from "@/components/tip";
import { useLocale } from "@/i18n/locale-provider";

/** Emails that are never cut off by the request limit. Has its own Save: it does not need edit mode. */
export function AdminPrivileged() {
  const { locale } = useLocale();
  const es = locale !== "en";
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/admin/privileged")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { emails?: string[] } | null) => {
        if (!live || !d?.emails) return;
        const value = d.emails.join("\n");
        setText(value);
        setSaved(value);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/privileged", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: text }),
      });
      const data = (await res.json().catch(() => ({}))) as { emails?: string[]; error?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: es ? `No se pudo guardar (${data.error ?? res.status}).` : `Could not save (${data.error ?? res.status}).` });
        return;
      }
      const value = (data.emails ?? []).join("\n");
      setText(value);
      setSaved(value);
      setMsg({ ok: true, text: es ? "Guardado." : "Saved." });
    } finally {
      setBusy(false);
    }
  };

  const title = es ? "Sin límite de pedidos" : "No request limit";
  return (
    <section className="adm-group" aria-label={title}>
      <h3 className="adm-h">{title}</h3>
      <label className="adm-field">
        <Tip text={es ? "Un email por línea. Tu cuenta siempre está incluida. El resto se corta si manda demasiados pedidos seguidos." : "One email per line. Your account is always included. Everyone else is cut off if they send too many requests in a row."}>
          <span className="adm-label">{es ? "Emails" : "Emails"}</span>
        </Tip>
        <textarea className="adm-input" rows={3} value={text} spellCheck={false} aria-label={title} placeholder="nombre@gmail.com" onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="adm-foot">
        <button type="button" className="adm-btn" disabled={busy || text === saved} onClick={() => void save()}>
          {busy ? "…" : es ? "Guardar lista" : "Save list"}
        </button>
        {msg ? <span className={`adm-msg${msg.ok ? " is-ok" : " is-bad"}`} role="status">{msg.text}</span> : null}
      </div>
    </section>
  );
}
