import type { CSSProperties } from "react";
import type { BuiltArt } from "@/content/home-copy";
import type { Locale } from "@/i18n/types";

const d = (n: number) => ({ ["--d" as string]: n }) as CSSProperties;

/**
 * Hero flow: what comes in (meeting, email, receipt) -> LULOX -> you check (violet) -> where it lands.
 * Plain HTML so it reads without JS and stacks vertically on phones. It fades in once on load
 * (landing.css); under prefers-reduced-motion it is simply there.
 */
export function HeroFlow({ inputs, core, human, outputs, label }: { inputs: string[]; core: string; human: string; outputs: string[]; label: string }) {
  return (
    <figure className="ln-flow" aria-label={label}>
      <ul className="ln-flow-col ln-flow-in">
        {inputs.map((t, i) => (
          <li key={i} className="ln-node" style={d(i)}>{t}</li>
        ))}
      </ul>
      <span className="ln-flow-arrow" aria-hidden style={d(3)} />
      <div className="ln-node ln-node-core" style={d(4)}>{core}</div>
      <span className="ln-flow-arrow" aria-hidden style={d(5)} />
      <div className="ln-node ln-node-human" style={d(6)}>{human}</div>
      <span className="ln-flow-arrow" aria-hidden style={d(7)} />
      <ul className="ln-flow-col ln-flow-out">
        {outputs.map((t, i) => (
          <li key={i} className="ln-node ln-node-out" style={d(8 + i)}>{t}</li>
        ))}
      </ul>
    </figure>
  );
}

/** Mini flow of one case: chips with arrows that wrap on phones. `human` is the violet step. */
export function FlowChips({ steps, human }: { steps: string[]; human: number }) {
  return (
    <ol className="ln-chips">
      {steps.map((s, i) => (
        <li key={i} className={i === human ? "ln-chip is-human" : "ln-chip"}><span className="ln-chip-label">{s}</span></li>
      ))}
    </ol>
  );
}

/**
 * Small screens for "Cosas que ya armé". Illustrations with test data only:
 * no amounts, no accounts, no real names.
 */
export function BuiltShot({ art, locale }: { art: BuiltArt; locale: Locale }) {
  const es = locale === "es";
  switch (art) {
    case "receipt":
      return (
        <div className="ln-shot" aria-hidden>
          <div className="ln-shot-bar"><b>Tarask</b></div>
          <div className="ln-shot-receipt">
            <span className="ln-shot-paper"><i /><i /><i /><i className="is-short" /></span>
            <span className="ln-shot-fields">
              <span><em>{es ? "Comercio" : "Merchant"}</em>{es ? "Librería de prueba" : "Test bookshop"}</span>
              <span><em>{es ? "Fecha" : "Date"}</em>{es ? "jueves" : "Thursday"}</span>
              <span><em>{es ? "Estado" : "Status"}</em><strong className="ln-shot-ok">{es ? "Listo para revisar" : "Ready to check"}</strong></span>
            </span>
          </div>
        </div>
      );
    case "summary":
      return (
        <div className="ln-shot" aria-hidden>
          <div className="ln-shot-bar"><b>{es ? "Resumen nuevo" : "New summary"}</b><span>{es ? "hace 5 min" : "5 min ago"}</span></div>
          <div className="ln-shot-mail">
            <span className="ln-shot-title">{es ? "Video: Ideas para tu negocio" : "Video: Ideas for your business"}</span>
            <span className="ln-shot-bullet">{es ? "Punto clave 1" : "Key point 1"}</span>
            <span className="ln-shot-bullet">{es ? "Punto clave 2" : "Key point 2"}</span>
            <span className="ln-shot-bullet">{es ? "Punto clave 3" : "Key point 3"}</span>
          </div>
        </div>
      );
    case "outings":
      return (
        <div className="ln-shot" aria-hidden>
          <div className="ln-shot-bar"><b>{es ? "Planes del finde" : "Weekend plans"}</b><span>{es ? "jueves" : "Thursday"}</span></div>
          <div className="ln-shot-list">
            <span><i className="ln-dot" />{es ? "Feria en una plaza cercana" : "Market at a nearby square"}</span>
            <span><i className="ln-dot" />{es ? "Cine al aire libre" : "Open-air cinema"}</span>
            <span><i className="ln-dot" />{es ? "Muestra gratis" : "Free exhibition"}</span>
          </div>
        </div>
      );
    case "garpen":
      return (
        <div className="ln-shot" aria-hidden>
          <div className="ln-shot-bar"><b>Garpen</b><span>{es ? "Agenda" : "Agenda"}</span></div>
          <div className="ln-shot-list">
            <span><i className="ln-dot is-hot" />{es ? "Llamar a Cliente A" : "Call Client A"}</span>
            <span><i className="ln-dot is-warm" />{es ? "Mandar propuesta" : "Send proposal"}</span>
            <span><i className="ln-dot is-ok" />{es ? "Seguimiento" : "Follow-up"}</span>
          </div>
        </div>
      );
    case "malito":
      return (
        <div className="ln-shot" aria-hidden>
          <div className="ln-shot-bar"><b>Malito</b><span>{es ? "Boletín" : "Newsletter"}</span></div>
          <div className="ln-shot-mail">
            <span className="ln-shot-title">{es ? "Novedades de noviembre" : "November news"}</span>
            <span className="ln-shot-line" />
            <span className="ln-shot-line is-short" />
            <span className="ln-shot-wait">{es ? "Espera tu OK" : "Waiting for your OK"}</span>
          </div>
        </div>
      );
    case "agents":
      return (
        <div className="ln-shot" aria-hidden>
          <div className="ln-shot-bar"><b>{es ? "Agentes" : "Agents"}</b></div>
          <div className="ln-shot-chat">
            <span className="ln-bubble">{es ? "Borrador del post listo." : "Post draft ready."}</span>
            <span className="ln-bubble is-me">{es ? "Dale, publicalo." : "Go ahead, post it."}</span>
          </div>
        </div>
      );
  }
}
