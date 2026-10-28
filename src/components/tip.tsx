"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const LONG_PRESS_MS = 450;
const SHOW_MS = 2600;

/**
 * Help text that lives only in a tooltip: hover or keyboard focus on desktop,
 * long-press on touch. Placed with position: fixed from the anchor's rect, so
 * a scrolling panel never clips it.
 */
export function Tip({ text, children, className }: { text: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const press = useRef(0);
  const hide = useRef(0);
  const touched = useRef(false);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(240, window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8);
    const below = r.bottom + 8 + 64 < window.innerHeight;
    setPos({ left, top: below ? r.bottom + 8 : Math.max(8, r.top - 8 - 56) });
  };
  const close = () => {
    window.clearTimeout(press.current);
    window.clearTimeout(hide.current);
    setPos(null);
  };
  useEffect(() => () => {
    window.clearTimeout(press.current);
    window.clearTimeout(hide.current);
  }, []);

  return (
    <span
      ref={ref}
      className={`tip${className ? ` ${className}` : ""}`}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") show();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") close();
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        touched.current = true;
        window.clearTimeout(press.current);
        press.current = window.setTimeout(() => {
          show();
          hide.current = window.setTimeout(close, SHOW_MS);
        }, LONG_PRESS_MS);
      }}
      onPointerUp={() => window.clearTimeout(press.current)}
      onPointerCancel={() => window.clearTimeout(press.current)}
      onFocus={(e) => {
        // Keyboard focus only: a tap on touch must not leave the tip open.
        if ((e.target as HTMLElement).matches(":focus-visible")) show();
      }}
      onBlur={close}
      onContextMenu={(e) => {
        // Long-press on touch would open the browser menu instead of the tip.
        if (touched.current) e.preventDefault();
      }}
    >
      {children}
      {pos ? (
        <span className="tip-bubble" role="tooltip" style={{ left: pos.left, top: pos.top }}>
          {text}
        </span>
      ) : null}
    </span>
  );
}
