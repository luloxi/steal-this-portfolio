"use client";

import { Children, isValidElement, cloneElement, useRef, useState, type ReactNode, type ReactElement } from "react";

/** Laugh clip (silence trimmed). Fetched on first press. */
export const LAUGH_SRC = "/audio/carlitox-jojojo.mp3";
export const LAUGH_SRC_OGG = "/audio/carlitox-jojojo.ogg";
const LAUGH_RE = /(jojojo|hohoho)/i;

let laughBase: HTMLAudioElement | null = null;

/** Soundboard press: a fresh clone of the laugh each time (instant restart, presses overlap). */
export function playLaugh(onError?: () => void) {
  if (!laughBase) {
    const probe = document.createElement("audio");
    const a = new Audio(probe.canPlayType('audio/ogg; codecs="opus"') ? LAUGH_SRC_OGG : LAUGH_SRC);
    a.preload = "auto";
    laughBase = a;
  }
  if (onError) laughBase.addEventListener("error", onError, { once: true });
  const voice = laughBase.cloneNode() as HTMLAudioElement;
  voice.play().catch(() => undefined);
}

/** Small press bounce (skipped under prefers-reduced-motion). */
export function bounce(node: HTMLElement | null, strength = 1) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !node?.animate) return;
  const k = (v: number) => 1 + (v - 1) * strength;
  node.animate(
    [
      { transform: "scale(1)" },
      { transform: `scale(${k(0.86)}) rotate(${-4 * strength}deg)`, offset: 0.25 },
      { transform: `scale(${k(1.14)}) rotate(${3 * strength}deg)`, offset: 0.6 },
      { transform: "scale(1)" },
    ],
    { duration: 320, easing: "cubic-bezier(.3,1.6,.5,1)" },
  );
}

/**
 * "jojojo" in the story: a soundboard button. Every press starts the laugh
 * again right away (rapid presses overlap), with a small bounce.
 */
export function LaughButton({ children }: { children: ReactNode }) {
  const el = useRef<HTMLSpanElement | null>(null);
  const [missing, setMissing] = useState(false);
  const play = () => {
    playLaugh(() => setMissing(true));
    bounce(el.current);
  };
  return (
    <span
      ref={el}
      role="button"
      tabIndex={0}
      className={`laugh-btn${missing ? " is-missing" : ""}`}
      title="Carlitox ▶"
      aria-label={`${typeof children === "string" ? children : "jojojo"} (▶ audio)`}
      onPointerDown={(e) => {
        // Fire on press (not release) so rapid taps feel instant.
        if (e.button === 0) {
          e.preventDefault();
          play();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          play();
        }
      }}
    >
      {children}
      <span className="laugh-btn-icon" aria-hidden>
        ▸
      </span>
    </span>
  );
}

/** Wraps every "jojojo" (or "hohoho") in rendered text with a LaughButton. */
export function withLaugh(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      if (!LAUGH_RE.test(child)) return child;
      return child.split(LAUGH_RE).map((part, i) => (i % 2 === 1 ? <LaughButton key={i}>{part}</LaughButton> : part));
    }
    if (isValidElement(child)) {
      const c = child as ReactElement<{ children?: ReactNode }>;
      if (c.props.children === undefined) return child;
      return cloneElement(c, undefined, withLaugh(c.props.children));
    }
    return child;
  });
}
