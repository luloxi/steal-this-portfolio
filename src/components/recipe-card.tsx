"use client";

import { useId, useState } from "react";
import { ContactTrigger } from "@/components/contact-modal";
import { CopyPrompt } from "@/components/copy-prompt";
import { RecipeArt } from "@/components/recipe-art";

type Labels = { needs: string; prompt: string; copy: string; copied: string; steps: string; use: string; hide: string; hire: string };

/** One recipe in the book: picture, title, benefit, two buttons. The prompt stays hidden until «Usar la receta». */
export function RecipeCard({
  slug,
  index,
  title,
  result,
  needs,
  prompt,
  steps,
  hireMessage,
  labels,
}: {
  slug: string;
  index: number;
  title: string;
  result: string;
  needs: string;
  prompt: string;
  steps: string[];
  hireMessage: string;
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <article id={slug} className={open ? "rc-card is-open" : "rc-card"} data-tone={index % 4}>
      <div className="rc-art-wrap"><RecipeArt slug={slug} /></div>
      <div className="rc-card-body">
        <h2 className="rc-title">{title}</h2>
        <p className="rc-result">{result}</p>
        <div className="rc-actions">
          <button
            type="button"
            className="hm-cta-link rc-btn"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            data-testid={`recipe-use-${slug}`}
          >
            {open ? labels.hide : labels.use}
          </button>
          <ContactTrigger className="hm-more rc-btn" prefill={hireMessage} data-testid={`recipe-hire-${slug}`}>
            {labels.hire}
          </ContactTrigger>
        </div>
        <div id={panelId} className="rc-panel" hidden={!open}>
          <p className="rc-needs"><strong>{labels.needs}:</strong> {needs}</p>
          <CopyPrompt text={prompt} label={labels.prompt} copyLabel={labels.copy} copiedLabel={labels.copied} />
          <p className="rc-steps-label">{labels.steps}</p>
          <ol className="rc-steps">
            {steps.map((s, k) => <li key={k}>{s}</li>)}
          </ol>
        </div>
      </div>
    </article>
  );
}
