"use client";

import { useState } from "react";

/** A prompt in a quiet box with one big Copiar button. Falls back to selecting the text. */
export function CopyPrompt({ text, label, copyLabel, copiedLabel }: { text: string; label: string; copyLabel: string; copiedLabel: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 2000);
  };
  return (
    <div className="rc-prompt">
      <div className="rc-prompt-head">
        <span className="rc-prompt-label">{label}</span>
        <button type="button" className="hm-cta-link rc-copy" onClick={() => void copy()} aria-live="polite">
          {done ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="rc-prompt-text">{text}</pre>
    </div>
  );
}
