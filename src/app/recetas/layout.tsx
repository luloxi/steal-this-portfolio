import { recipesCopy } from "@/content/recipes";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("/recetas", {
    es: { title: recipesCopy.es.meta.title, description: recipesCopy.es.meta.description },
    en: { title: recipesCopy.en.meta.title, description: recipesCopy.en.meta.description },
  });
}

export default function RecipesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
