/**
 * Preview media for /proyectos cards, by D1 project id. Real captures only:
 * - "video": short muted loop in public/demos (<name>.webm|mp4 + <name>.webp poster),
 *   recorded from the real app (local/test data, the live site or its public web archive).
 * - "still": a real image from the project when no working app was available to record.
 * Projects without an entry show as a compact tile.
 */
export type ProjectMedia =
  | { kind: "video"; name: string; alt: { es: string; en: string } }
  | { kind: "still"; src: string; alt: { es: string; en: string } };

export const PROJECT_MEDIA: Record<string, ProjectMedia> = {
  malito: { kind: "video", name: "malito", alt: { es: "Malito con datos de prueba: bandeja de entrada, lectura de un mail y una campaña del boletín.", en: "Malito with test data: inbox, reading an email and a newsletter campaign." } },
  garpen: { kind: "video", name: "garpen", alt: { es: "Garpen con una cuenta de prueba local: resumen, contactos, agenda y finanzas.", en: "Garpen with a local test account: summary, contacts, agenda and finances." } },
  djtube: { kind: "video", name: "djtube", alt: { es: "DJ Tube en vivo: los dos decks, el crossfader y los volúmenes de cada lado.", en: "DJ Tube live: the two decks, the crossfader and each side's volume." } },
  sami: { kind: "video", name: "sami", alt: { es: "SAMI (copia archivada del sitio): las reglas del juego, chatear y votar quién es la IA.", en: "SAMI (archived copy of the site): the game rules, chat and vote on who the AI is." } },
  punksociety: { kind: "still", src: "/demos/punksociety.webp", alt: { es: "Imagen de presentación de PunkSociety.", en: "PunkSociety cover image." } },
  mochi: { kind: "still", src: "/demos/mochi.webp", alt: { es: "El conejo de Mochi, la mascota del proyecto.", en: "Mochi's bunny, the project's mascot." } },
};
