import { ContactTrigger } from "@/components/contact-modal";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { RecipeCard } from "@/components/recipe-card";
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
      <PageShell title={c.title} wide>
        <div className="ln rc">
          <div className="rc-head">
            <p className="rc-intro">{c.intro}</p>
            <p className="rc-works">{c.works}</p>
          </div>
          <div className="rc-grid">
            {RECIPES.map((r, i) => {
              const x = r.copy[locale];
              return (
                <RecipeCard
                  key={r.slug}
                  slug={r.slug}
                  index={i}
                  title={x.title}
                  result={x.result}
                  needs={x.needs}
                  prompt={x.prompt}
                  steps={x.steps}
                  hireMessage={c.hire.message.replace("{receta}", x.title)}
                  labels={{ needs: c.needsLabel, prompt: c.promptLabel, copy: c.copy, copied: c.copied, steps: c.stepsLabel, use: c.use, hide: c.hide, hire: c.hire.button }}
                />
              );
            })}
          </div>
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
