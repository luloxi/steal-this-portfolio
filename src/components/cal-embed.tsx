"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cal.com inline booking. The embed script does NOT define window.Cal: it drains
 * the queue we create first (that is what the official snippet does). So we set
 * up the queue, enqueue init/inline, and cal.com injects the iframe. Everything
 * stays on cal.com, so agents and people book from the same public link.
 */
const CAL_ORIGIN = "https://cal.com";
const CAL_USER = "lulox";
const EMBED_SRC = "https://app.cal.com/embed/embed.js";
/** How long we wait for cal.com to inject the iframe before offering a retry. */
const READY_TIMEOUT_MS = 9000;

export const CAL_DURATIONS = ["30min", "15min"] as const;
export type CalDuration = (typeof CAL_DURATIONS)[number];

type CalFn = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns: Record<string, CalFn>;
  q: unknown[][];
};

declare global {
  interface Window {
    Cal?: CalFn;
  }
}

let scriptStarted = false;

function ensureCal(): CalFn {
  if (window.Cal) return window.Cal;
  const cal = ((...args: unknown[]) => {
    cal.q.push(args);
  }) as CalFn;
  cal.q = [];
  cal.ns = {};
  cal.loaded = false;
  window.Cal = cal;
  if (!scriptStarted) {
    scriptStarted = true;
    const script = document.createElement("script");
    script.src = EMBED_SRC;
    script.async = true;
    script.dataset.calEmbed = "1";
    script.onload = () => {
      if (window.Cal) window.Cal.loaded = true;
    };
    document.head.appendChild(script);
  }
  return cal;
}

export function calLink(duration: CalDuration): string {
  return `${CAL_USER}/${duration}`;
}

export function calUrl(duration: CalDuration): string {
  return `${CAL_ORIGIN}/${calLink(duration)}`;
}

export function CalEmbed({
  duration,
  labels,
}: {
  duration: CalDuration;
  labels: { loading: string; error: string; retry: string };
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!holder.current) return;
    const cal = ensureCal();
    cal("init", { origin: CAL_ORIGIN });
    cal("inline", {
      elementOrSelector: holder.current,
      calLink: calLink(duration),
      config: { theme: "auto", layout: "month_view" },
    });

    const timer = window.setTimeout(() => {
      setState(holder.current?.querySelector("iframe") ? "ready" : "error");
    }, READY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [duration, attempt]);

  return (
    <div className="cal-embed" data-testid="cal-embed">
      {state === "loading" ? <p className="cal-embed-note">{labels.loading}</p> : null}
      {state === "error" ? (
        <p className="cal-embed-note">
          {labels.error}{" "}
          <button
            type="button"
            className="cal-embed-retry"
            onClick={() => {
              setState("loading");
              setAttempt((n) => n + 1);
            }}
          >
            {labels.retry}
          </button>
        </p>
      ) : null}
      <div ref={holder} className="cal-embed-frame" style={{ minHeight: 620 }} />
    </div>
  );
}
