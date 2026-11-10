"use client";

import { useEffect, useState } from "react";
import { FIXED_NOW } from "@/desktop/model";

/** Wall clock. The first paint uses a fixed instant so SSR matches; the timeout moves it to now. */
export function useClock(ms = 1000): number {
  const [now, setNow] = useState(FIXED_NOW);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, ms);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [ms]);
  return now;
}
