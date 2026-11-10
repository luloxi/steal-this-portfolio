"use client";

import { useLayoutEffect, useState } from "react";
import { HomeView } from "@/components/views/home-view";
import { Desktop } from "@/components/desktop/desktop";

/** Top-level `/` is the desktop. The same URL inside a window (or ?win=portfolio) is the portfolio landing. */
export function HomeGate({ embed }: { embed: boolean }) {
  const [inner, setInner] = useState(embed);
  useLayoutEffect(() => {
    // A later click on "inicio" inside the portfolio window loads `/` again. If the browser
    // doesn't mark that request as an iframe, stay on the landing instead of nesting a desktop.
    if (window.top !== window.self) setInner(true); // eslint-disable-line react-hooks/set-state-in-effect -- iframe check is only available on the client
  }, []);
  if (inner) return <HomeView />;
  return <Desktop />;
}
