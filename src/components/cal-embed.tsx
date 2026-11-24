"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cal.com inline booking. Loads the official embed once and re-renders it when
 * the visitor switches duration. Everything stays on cal.com — we only host the
 * iframe, so agents and people can both book from the same public link.
 */
const CAL_ORIGIN = "https://cal.com";
const CAL_USER = "lulox";
const EMBED_SRC = "https://app.cal.com/embed/embed.js";

export const CAL_DURATIONS = ["30min", "15min"] as const;
export type CalDuration = (typeof CAL_DURATIONS)[number];

type CalFn = ((action: string, data?: Record<string, unknown>) => void) & { loaded?: boolean };

declare global {
  interface Window {
    Cal?: CalFn;
  }
}

let loading: Promise<CalFn> | null = null;

function loadCal(): Promise<CalFn> {
  if (window.Cal?.loaded) return Promise.resolve(window.Cal);
  if (loading) return loading;
  loading = new Promise<CalFn>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = EMBED_SRC;
    script.async = true;
    script.dataset.calEmbed = "1";
    script.onload = () => {
      if (window.Cal) resolve(window.Cal);
      else reject(new Error("Cal no quedó disponible"));
    };
    script.onerror = () => reject(new Error("No pude cargar cal.com"));
    document.head.appendChild(script);
  });
  return loading;
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
    let cancelled = false;
    loadCal()
      .then((cal) => {
        if (cancelled || !holder.current) return;
        cal("init", { origin: CAL_ORIGIN });
        cal("inline", {
          elementOrSelector: holder.current,
          calLink: calLink(duration),
          config: { theme: "auto", layout: "month_view" },
        });
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
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
