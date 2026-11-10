"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { APPS, appName, type AppId, type Win } from "@/desktop/model";
import { useDesk } from "@/components/desktop/store";
import { useLocale } from "@/i18n/locale-provider";
import { DjTube } from "@/components/desktop/apps/djtube";
import { Garpen } from "@/components/desktop/apps/garpen";
import { Malito } from "@/components/desktop/apps/malito";
import { PortfolioWindow } from "@/components/desktop/apps/portfolio";
import { Tarask } from "@/components/desktop/apps/tarask";

const DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;

export function WindowFrame({
  win,
  active,
  children,
}: {
  win: Win;
  active: boolean;
  children: ReactNode;
}) {
  const { dispatch, mobile } = useDesk();
  const { locale } = useLocale();
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; cx: number; cy: number } | null>(null);
  const meta = APPS.find((a) => a.id === win.app);
  const en = locale === "en";
  const label = appName(win.app, en ? "en" : "es");

  const raise = () => dispatch({ op: "focus", app: win.app });

  const onTitleDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (mobile || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    raise();
    const stage = (e.currentTarget.closest(".dk-stage") as HTMLElement | null)?.getBoundingClientRect();
    if (!stage) return;
    drag.current = { x: win.x, y: win.y, ox: e.clientX - stage.left - win.x, oy: e.clientY - stage.top - win.y, cx: e.clientX, cy: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onTitleMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const stage = (e.currentTarget.closest(".dk-stage") as HTMLElement | null)?.getBoundingClientRect();
    if (!stage) return;
    const x = e.clientX - stage.left - d.ox;
    const y = e.clientY - stage.top - d.oy;
    d.x = x;
    d.y = y;
    dispatch({
      op: "set",
      recipe: (s) => ({
        ...s,
        windows: s.windows.map((w) => (w.id === win.id ? { ...w, x, y, maximized: false } : w)),
      }),
    });
  };

  const onTitleUp = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (Math.hypot(e.clientX - d.cx, e.clientY - d.cy) < 8) return;
    const stage = (e.currentTarget.closest(".dk-stage") as HTMLElement | null)?.getBoundingClientRect();
    if (!stage) return;
    if (d.y < 10) dispatch({ op: "box", app: win.app, box: "max" });
    else if (d.x < 16) dispatch({ op: "box", app: win.app, box: "left" });
    else if (d.x + win.w > stage.width - 16) dispatch({ op: "box", app: win.app, box: "right" });
  };

  const startResize = (e: ReactPointerEvent<HTMLElement>, dir: string) => {
    if (mobile) return;
    e.stopPropagation();
    e.preventDefault();
    raise();
    const start = { cx: e.clientX, cy: e.clientY, x: win.x, y: win.y, w: win.w, h: win.h };
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.cx;
      const dy = ev.clientY - start.cy;
      let { x, y, w, h } = start;
      if (dir.includes("e")) w = start.w + dx;
      if (dir.includes("s")) h = start.h + dy;
      if (dir.includes("w")) {
        w = start.w - dx;
        x = start.x + dx;
      }
      if (dir.includes("n")) {
        h = start.h - dy;
        y = start.y + dy;
      }
      w = Math.max(280, w);
      h = Math.max(180, h);
      dispatch({
        op: "set",
        recipe: (s) => ({
          ...s,
          windows: s.windows.map((item) => (item.id === win.id ? { ...item, x, y, w, h, maximized: false } : item)),
        }),
      });
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  return (
    <section
      className={`dk-win${active ? " is-focus" : ""}${win.minimized ? " is-min" : ""}`}
      data-win={win.app}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      role="dialog"
      aria-label={label}
      onPointerDown={raise}
    >
      <header
        className="dk-title"
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={onTitleUp}
        onDoubleClick={() => dispatch({ op: "box", app: win.app, box: win.maximized ? "restore" : "max" })}
      >
        {meta ? (
          // eslint-disable-next-line @next/next/no-img-element -- small app mark, same file the portfolio already serves
          <img src={meta.icon} alt="" className="dk-title-ico" />
        ) : null}
        <span className="dk-title-name">{label}</span>
        <span className="dk-win-acts">
          <button type="button" aria-label={en ? "Minimize" : "Minimizar"} onClick={() => dispatch({ op: "box", app: win.app, box: "min" })}>
            −
          </button>
          <button type="button" aria-label={en ? "Maximize" : "Maximizar"} onClick={() => dispatch({ op: "box", app: win.app, box: win.maximized ? "restore" : "max" })}>
            □
          </button>
          <button type="button" aria-label={en ? "Close" : "Cerrar"} onClick={() => dispatch({ op: "close", app: win.app })}>
            ×
          </button>
        </span>
      </header>
      <div className={`dk-win-body${win.app === "portfolio" || win.app === "djtube" ? " is-flush" : ""}`}>{children}</div>
      {DIRS.map((dir) => (
        <span key={dir} className={`dk-rz dk-rz-${dir}`} onPointerDown={(e) => startResize(e, dir)} />
      ))}
    </section>
  );
}

export function AppView({ app }: { app: AppId }) {
  if (app === "djtube") return <DjTube />;
  if (app === "garpen") return <Garpen />;
  if (app === "tarask") return <Tarask />;
  if (app === "malito") return <Malito />;
  return <PortfolioWindow />;
}
