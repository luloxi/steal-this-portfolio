/**
 * Talks shown on Sobre mí (/sobre-mi, /en/about). Facts come only from the event page.
 * To add photos: drop optimized .webp files in public/talks/ and list them in `photos`
 * (one or two read best); the block lays them out on its own.
 */
export type TalkPhoto = { src: string; width: number; height: number; alt: { es: string; en: string } };

type TalkCopy = { before: string; link: string; after: string };

/** image: the event's own artwork (e.g. its logo), shown small next to the text. */
export type Talk = { url: string; date: string; es: TalkCopy; en: TalkCopy; image?: TalkPhoto; photos: readonly TalkPhoto[] };

export const TALKS: readonly Talk[] = [
  {
    url: "https://luma.com/4ehgix94",
    date: "2025-04-10",
    es: {
      before: "En abril de 2025 di la charla ",
      link: "«SAMI, una IA infiltrada entre humanos»",
      after: " en Aleph Hub, Buenos Aires, con una demo en vivo de un juego donde los jugadores tienen que descubrir quién es la IA infiltrada.",
    },
    en: {
      before: "In April 2025 I gave the talk ",
      link: "“SAMI, an AI hidden among humans”",
      after: " at Aleph Hub, Buenos Aires, with a live demo of a game where players have to figure out which of them is the AI.",
    },
    // SAMI logo, the cover art of the Luma event page.
    image: {
      src: "/talks/sami-logo.webp",
      width: 800,
      height: 800,
      alt: { es: "Logo de SAMI: una cara sonriente de dos ojos cuadrados en celeste sobre fondo violeta", en: "SAMI logo: a smiling face with two square light blue eyes on a purple background" },
    },
    photos: [],
  },
];
