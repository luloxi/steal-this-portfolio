import type { BlogPost } from "./types";

/**
 * Sample post for a brand new database. Seeded only when blog_posts is empty.
 * A database that already has posts is left alone. Edit or delete this from
 * the blog, in edit mode.
 */
export const seedPosts: BlogPost[] = [
  {
    slug: "hola",
    slugEn: "hello",
    publishedAt: "2026-01-01",
    coverImage: "",
    published: true,
    tags: ["portfolio"],
    title: { es: "Hola", en: "Hello" },
    summary: {
      es: "Un artículo de ejemplo. Se reemplaza desde el blog.",
      en: "A sample post. Replace it from the blog.",
    },
    body: {
      es: "Este es un artículo de ejemplo para un portfolio vacío.\n\nEditalo o borralo desde el blog, con el modo edición.",
      en: "This is a sample post for an empty portfolio.\n\nEdit or delete it from the blog, with edit mode on.",
    },
  },
];
