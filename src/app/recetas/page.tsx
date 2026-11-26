import { ContactTrigger } from "@/components/contact-modal";
import { CopyPrompt } from "@/components/copy-prompt";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { RECIPES, recipesCopy } from "@/content/recipes";
import { getRequestLocale } from "@/lib/prefs";
import { localizePath } from "@/lib/routes";
import { breadcrumbLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-db";
import "../landing.css";
import "./recetas.css";

/** /recetas (/en/recipes): one free recipe per home case. Result first, prompt to copy, steps folded. */
export default async function RecipesPage() {
  const [locale, settings] = await Promise.all([getRequestLocale(), getSiteSettings()]);
  const c = recipesCopy[locale];
  const pageUrl = `${settings.url}${localizePath(locale, "/recetas")}`;
  const graph = [
    breadcrumbLd(settings, locale, [
      { name: settings.name, esPath: "/" },
      { name: c.title, esPath: "/recetas" },
    ]),
    ...RECIPES.map((r) => {
      const x = r.copy[locale];
      return {
        "@type": "HowTo",
        "@id": `${pageUrl}#${r.slug}`,
        name: x.title,
        description: x.result,
        inLanguage: locale === "es" ? "es-AR" : "en-US",
        isAccessibleForFree: true,
        step: [...x.steps, `${c.promptLabel}: ${x.prompt}`].map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
      };
    }),
  ];
  return (
    <>
      <JsonLd graph={graph} />
      <PageShell title={c.title}>
        <div className="ln rc">
          <p className="rc-intro">{c.intro}</p>
          <p className="rc-works">{c.works}</p>
          <ol className="rc-list">
            {RECIPES.map((r, i) => {
              const x = r.copy[locale];
              return (
                <li key={r.slug} id={r.slug} className="rc-card">
                  <h2 className="rc-title"><span className="rc-n" aria-hidden>{i + 1}</span>{x.title}</h2>
                  <p className="rc-result">{x.result}</p>
                  <p className="rc-needs"><strong>{c.needsLabel}:</strong> {x.needs}</p>
                  <CopyPrompt text={x.prompt} label={c.promptLabel} copyLabel={c.copy} copiedLabel={c.copied} />
                  <details className="rc-steps">
                    <summary>{c.stepsLabel}</summary>
                    <ol>
                      {x.steps.map((s, k) => <li key={k}>{s}</li>)}
                    </ol>
                  </details>
                  <p className="rc-hire">
                    <span>{c.hire.lead}</span>{" "}
                    <ContactTrigger className="rc-hire-link" prefill={c.hire.message.replace("{receta}", x.title)} data-testid={`recipe-hire-${r.slug}`}>
                      {c.hire.button} ▸
                    </ContactTrigger>
                  </p>
                </li>
              );
            })}
          </ol>
          <section className="rc-cta" aria-labelledby="rc-cta">
            <h2 id="rc-cta" className="rc-cta-title">{c.cta.title}</h2>
            <p className="rc-cta-body">{c.cta.body}</p>
            <ContactTrigger className="hm-cta-link ln-btn" data-testid="recipes-cta">{c.cta.button}</ContactTrigger>
          </section>
        </div>
      </PageShell>
    </>
  );
}
