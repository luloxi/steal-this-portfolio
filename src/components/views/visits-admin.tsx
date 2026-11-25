"use client";

import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import type { CountRow, UtmLink, VisitStats } from "@/lib/page-visits";

function Table({ title, testId, rows, empty }: { title: string; testId: string; rows: CountRow[]; empty: string }) {
  return (
    <section className="vist-card" data-testid={testId}>
      <h2 className="vist-h">{title}</h2>
      {rows.length === 0 ? <p className="ref-hint">{empty}</p> : (
        <table className="vist-table">
          <thead>
            <tr>
              <th scope="col">Origen o día</th>
              <th scope="col">Visitas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.key}</th>
                <td>{r.visits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function CopyLink({ link }: { link: UtmLink }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="vist-link" data-testid={`utm-${link.source}-${link.campaign}`}>
      <div className="vist-link-meta">
        <strong>{link.labelEs}</strong>
        <code>{link.url}</code>
      </div>
      <button
        type="button"
        className="radm-btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </li>
  );
}

/** /admin/visitas: the owner's visit counts and ready-to-paste UTM links (Spanish only). */
export function VisitsAdmin({ stats, links, loadError }: { stats: VisitStats; links: UtmLink[]; loadError: boolean }) {
  return (
    <PageShell title="Visitas">
      <div className="vist" data-testid="visits-admin">
        {loadError ? <p className="ref-error">No se pudo leer D1 (¿falta la migración 0016?).</p> : null}
        <p className="ref-sub">
          Últimos 60 días · <strong data-testid="vist-total">{stats.total}</strong> visitas · Implementación de IA (<code>/contacto</code>): <strong data-testid="vist-hire">{stats.hireTotal}</strong>
        </p>
        <p className="ref-hint">
          Contador propio, sin cookies ni IP: día (hora de Argentina), página, origen (utm o sitio que te mandó) y país. Los totales de todo el sitio también están en el panel de Cloudflare Web Analytics.
        </p>
        <Table title="Visitas por día" testId="vist-by-day" rows={stats.byDay} empty="Todavía no hay visitas." />
        <Table title="Visitas por origen" testId="vist-by-source" rows={stats.bySource} empty="Todavía no hay orígenes." />
        <Table title="Implementación de IA, por día" testId="vist-hire-by-day" rows={stats.hireByDay} empty="Todavía no hay visitas a /contacto." />
        <Table title="Implementación de IA, por origen" testId="vist-hire-by-source" rows={stats.hireBySource} empty="Todavía no hay orígenes en /contacto." />
        <section className="vist-card" data-testid="vist-utm-links">
          <h2 className="vist-h">Links con UTM, listos para pegar</h2>
          <p className="ref-hint">Usalos en Instagram, LinkedIn, X y el mail. Así en esta página se distingue de dónde vino cada visita.</p>
          <ul className="vist-links">
            {links.map((link) => (
              <CopyLink key={`${link.source}-${link.campaign}`} link={link} />
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
