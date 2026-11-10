"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { runCommand } from "@/desktop/commands";
import {
  applyOp,
  FIXED_NOW,
  readStore,
  seed,
  writeStore,
  type CmdCtx,
  type DeskState,
  type Op,
} from "@/desktop/model";

type DeskApi = {
  state: DeskState;
  mobile: boolean;
  dispatch: (op: Op) => void;
  ask: (text: string) => string;
  stageRef: (el: HTMLElement | null) => void;
};

const DeskContext = createContext<DeskApi | null>(null);

export function useDesk(): DeskApi {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDesk outside the desktop");
  return ctx;
}

export function DeskProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const localeRef = useRef(locale);
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);
  const metrics = useRef({ w: 1100, h: 680, mobile: false });
  const [mobile, setMobile] = useState(false);
  const [stageEl, setStageEl] = useState<HTMLElement | null>(null);
  const [state, setState] = useState<DeskState>(() => seed(FIXED_NOW));
  const skipSave = useRef(true);

  const makeCtx = useCallback(
    (over?: Partial<CmdCtx>): CmdCtx => ({
      w: metrics.current.w,
      h: metrics.current.h,
      mobile: metrics.current.mobile,
      now: Date.now(),
      id: () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      locale: localeRef.current === "en" ? "en" : "es",
      ...over,
    }),
    [],
  );

  const dispatch = useCallback(
    (op: Op) => {
      setState((s) => applyOp(s, op, makeCtx()));
    },
    [makeCtx],
  );

  const ask = useCallback(
    (text: string) => {
      let reply = "";
      setState((s) => {
        const out = runCommand(text, s, makeCtx());
        reply = out.reply;
        return out.state;
      });
      return reply;
    },
    [makeCtx],
  );

  useEffect(() => {
    const saved = readStore(Date.now());
    setState(saved ?? seed(Date.now())); // eslint-disable-line react-hooks/set-state-in-effect -- this browser's desktop is in localStorage, not available while rendering on the server
  }, []);

  useEffect(() => {
    if (!stageEl) return;
    const measure = () => {
      const w = stageEl.clientWidth;
      const h = stageEl.clientHeight;
      if (w < 40 || h < 40) return;
      const m = window.matchMedia("(max-width: 800px)").matches;
      const prev = metrics.current;
      metrics.current = { w, h, mobile: m };
      setMobile(m);
      if (Math.abs(prev.w - w) > 4 || Math.abs(prev.h - h) > 4 || prev.mobile !== m) {
        setState((s) => applyOp(s, { op: "clamp" }, makeCtx({ w, h, mobile: m })));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stageEl);
    return () => ro.disconnect();
  }, [stageEl, makeCtx]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    writeStore(state);
  }, [state]);

  const stageRef = useCallback((el: HTMLElement | null) => {
    setStageEl(el);
  }, []);

  return <DeskContext.Provider value={{ state, mobile, dispatch, ask, stageRef }}>{children}</DeskContext.Provider>;
}
