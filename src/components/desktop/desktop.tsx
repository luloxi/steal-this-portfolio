"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";
import { APPS, appName, focusedWin } from "@/desktop/model";
import { DeskProvider, useDesk } from "@/components/desktop/store";
import { AppView, WindowFrame } from "@/components/desktop/windows";
import { TasksBoard } from "@/components/desktop/tasks-board";
import { Mochi } from "@/components/desktop/mochi";

export function Desktop() {
  return (
    <DeskProvider>
      <Shell />
    </DeskProvider>
  );
}

function Shell() {
  const { state, dispatch, mobile, stageRef } = useDesk();
  const { locale } = useLocale();
  const site = useSiteSettings();
  const en = locale === "en";
  const [clock, setClock] = useState("");
  const front = focusedWin(state);
  const unread = state.mail.filter((m) => m.folder === "inbox" && !m.read).length;
  const urgent = state.tasks.filter((task) => task.priority === "urgent" && task.status !== "done").length;

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString(en ? "en-US" : "es-AR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [en]);

  const launch = (app: (typeof APPS)[number]["id"]) => {
    const open = state.windows.find((w) => w.app === app);
    if (state.mode === "desktop" && open && !open.minimized && front?.id === open.id) {
      dispatch({ op: "box", app, box: "min" });
      return;
    }
    dispatch({ op: "open", app });
  };

  return (
    <div className="dk">
      <header className="dk-bar">
        <strong className="dk-brand">{site.name}</strong>
        <div className="dk-modes" role="tablist" aria-label={en ? "Mode" : "Modo"}>
          <button type="button" className={state.mode === "desktop" ? "is-on" : ""} onClick={() => dispatch({ op: "mode", mode: "desktop" })}>
            {en ? "Desktop" : "Escritorio"}
          </button>
          <button type="button" className={state.mode === "tasks" ? "is-on" : ""} onClick={() => dispatch({ op: "mode", mode: "tasks" })}>
            {en ? "Tasks" : "Tareas"}
            {urgent ? <em className="dk-badge">{urgent}</em> : null}
          </button>
        </div>
        <span className="dk-grow" />
        <time className="dk-clock">{clock}</time>
        <ThemeToggle />
      </header>
      <div className={`dk-stage${state.mode === "tasks" ? " is-tasks" : ""}`} ref={stageRef}>
        {state.mode === "desktop" && (!mobile || !front) ? (
          <div className="dk-icons">
            {APPS.map((app) => (
              <button key={app.id} type="button" className="dk-icon" onClick={() => launch(app.id)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- small app mark, same file the portfolio already serves */}
                <img src={app.icon} alt="" />
                <span>{appName(app.id, en ? "en" : "es")}</span>
              </button>
            ))}
          </div>
        ) : null}
        {state.windows.map((win) => (
          <WindowFrame key={win.id} win={win} active={front?.id === win.id && !win.minimized}>
            <AppView app={win.app} />
          </WindowFrame>
        ))}
        {state.mode === "tasks" ? <TasksBoard /> : null}
      </div>
      <nav className="dk-dock" aria-label={en ? "Apps" : "Apps"}>
        {APPS.map((app) => {
          const open = state.windows.some((w) => w.app === app.id && !w.minimized);
          return (
            <button key={app.id} type="button" className={`dk-dock-btn${open ? " is-open" : ""}`} onClick={() => launch(app.id)} aria-label={appName(app.id, en ? "en" : "es")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- small app mark, same file the portfolio already serves */}
              <img src={app.icon} alt="" />
              {app.id === "malito" && unread ? <em className="dk-badge">{unread}</em> : null}
            </button>
          );
        })}
      </nav>
      <Mochi />
    </div>
  );
}
