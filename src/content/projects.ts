/**
 * Projects structure and default copy.
 * Live overrides (status, urls, team, texts) live in D1, edited in place on /proyectos.
 */

export type FocusTopicId =
  | "tokenization"
  | "midnight"
  | "hermes"
  | "lcp"
  | "x402"
  | "erc8004";

export type PastProjectId = "djtube" | "punksociety" | "sami" | "mochi";

export type FocusLink = {
  label: string;
  href: string;
};

export const focusTopics: {
  id: FocusTopicId;
  icon: string;
  /** 1-3 relevant external references shown under each topic */
  links: FocusLink[];
  /** Lowercase substrings that suggest this topic in a post body (admin editor) */
  keywords: string[];
}[] = [
  {
    id: "hermes",
    keywords: ["hermes", "nous research", "nous"],
    icon: "/projects/focus/nous.png",
    links: [
      { label: "Hermes Agent", href: "https://hermes-agent.nousresearch.com/" },
      { label: "GitHub", href: "https://github.com/nousresearch/hermes-agent" },
      { label: "Nous Research", href: "https://nousresearch.com/" },
    ],
  },
  {
    id: "lcp",
    keywords: ["lcp", "liquid commerce", "comercio agéntico", "agentic commerce"],
    icon: "/projects/focus/lcp.svg",
    links: [
      { label: "LCP", href: "https://legalcontextprotocol.org/" },
      {
        label: "Intro (AAA)",
        href: "https://www.adr.org/news-and-insights/introducing-the-legal-context-protocol/",
      },
    ],
  },
  {
    id: "x402",
    keywords: ["x402", "http 402", "402 payment"],
    icon: "/projects/focus/x402.svg",
    links: [
      { label: "x402", href: "https://x402.org/" },
      { label: "Docs", href: "https://docs.x402.org/" },
      {
        label: "GitHub",
        href: "https://github.com/x402-foundation/x402",
      },
    ],
  },
  {
    id: "erc8004",
    keywords: ["erc-8004", "erc8004", "8004"],
    icon: "/projects/focus/erc8004.svg",
    links: [
      {
        label: "EIP-8004",
        href: "https://eips.ethereum.org/EIPS/eip-8004",
      },
      { label: "8004.org", href: "https://www.8004.org/" },
      {
        label: "Magicians",
        href: "https://ethereum-magicians.org/t/erc-8004-trustless-agents/25098",
      },
    ],
  },
  {
    id: "midnight",
    keywords: ["midnight", "zk", "zero-knowledge", "conocimiento cero"],
    icon: "/projects/focus/midnight.svg",
    links: [
      { label: "Midnight", href: "https://midnight.network/" },
      { label: "Docs", href: "https://docs.midnight.network/" },
      { label: "Midnight Expert", href: "https://midnightntwrk.expert/" },
    ],
  },
  {
    id: "tokenization",
    keywords: ["tokeniz", "rwa", "erc-3643", "cip-113", "real world asset"],
    icon: "/projects/focus/tokenization.svg",
    links: [
      {
        label: "CIP-113",
        href: "https://github.com/cardano-foundation/cip113-programmable-tokens",
      },
      { label: "ERC-3643", href: "https://www.erc3643.org/" },
      {
        label: "EIP-3643",
        href: "https://eips.ethereum.org/EIPS/eip-3643",
      },
    ],
  },
];

export type ProjectStatus = "live" | "disabled" | "archive";

export type TeamMember = {
  name: string;
  href?: string;
};

export type ProjectCopyLocale = {
  title: string;
  body: string;
  paragraphs: string[];
  awards: string;
};

export type ProjectCopy = {
  es: ProjectCopyLocale;
  en: ProjectCopyLocale;
};

export type PastProject = {
  id: PastProjectId;
  icon: string;
  github: string;
  /** Public product URL when still up */
  liveUrl?: string;
  status: ProjectStatus;
  /**
   * Optional explanation shown when status is "disabled".
   * Bilingual so the project detail page can show why it is not running.
   */
  disabledReason?: {
    es: string;
    en: string;
  };
  /** Team credits (names are language-agnostic) */
  team: TeamMember[];
  /** Bilingual copy (defaults + D1 overrides) */
  copy: ProjectCopy;
};

/** Public DJTube URL. */
export const DJTUBE_URL = "https://dj.lulox.com.ar";

export const pastProjects: PastProject[] = [
  {
    id: "djtube",
    icon: "/projects/djtube.svg",
    github: "https://github.com/luloxi/djtube",
    liveUrl: DJTUBE_URL,
    status: "live",
    team: [{ name: "Solo" }],
    copy: {
      es: {
        title: "DJTube",
        body: "Una app web para hacer de DJ con YouTube: dos decks, crossfader, BPM, highlights y grabación.",
        paragraphs: [
          "Mezclás dos videos o playlists de YouTube con un crossfader, BPM detectado, cortes (highlights) guardados y grabación de la sesión. Todo en el navegador.",
          "Entrás con tu cuenta de Google.",
        ],
        awards: "",
      },
      en: {
        title: "DJTube",
        body: "A web app for DJing with YouTube: two decks, a crossfader, BPM, highlights, and recording.",
        paragraphs: [
          "You mix two YouTube videos or playlists with a crossfader, detected BPM, saved cuts (highlights), and a recording of the session. All in the browser.",
          "You sign in with your Google account.",
        ],
        awards: "",
      },
    },
  },
  {
    id: "mochi",
    icon: "/projects/mochi.png",
    github: "https://github.com/luloxi/Mochi",
    status: "disabled",
    disabledReason: {
      es: "Proyecto en pausa. El runtime, los contratos y el marketplace existen, pero la app no está en producción activa por ahora.",
      en: "Paused. Runtime, contracts and marketplace exist, but the app is not in active production right now.",
    },
    team: [{ name: "Kathonejo", href: "https://linktr.ee/kathonejo" }],
    copy: {
      es: {
        title: "Mochi",
        body: "Mascotas de IA de escritorio con chat, cuerpos custom y un marketplace propio.",
        paragraphs: [
          "Mochi son mascotas de IA de escritorio (y browser) con chat, cuerpos custom y un marketplace propio en Avalanche: ownership on-chain, AI off-chain.",
          "Incluye web app, app Electron y extensiones de Chrome/Firefox, con runtime compartido, contratos en Foundry y metadata en IPFS.",
        ],
        awards: "Sin premios formales.",
      },
      en: {
        title: "Mochi",
        body: "Desktop AI pets with chat, custom bodies, and their own marketplace.",
        paragraphs: [
          "Mochi is desktop (and browser) AI pets with chat, custom bodies, and an Avalanche marketplace: on-chain ownership, off-chain AI.",
          "It includes a web app, Electron desktop, Chrome/Firefox extensions, a shared runtime, Foundry contracts, and IPFS metadata.",
        ],
        awards: "No formal awards.",
      },
    },
  },
  {
    id: "sami",
    icon: "/projects/sami.png",
    github: "https://github.com/fabian416/sami",
    status: "disabled",
    disabledReason: {
      es: "Demo / hackathon. El código está disponible, pero no hay instancia pública corriendo en este momento.",
      en: "Demo / hackathon. Code is available, but there is no public instance running at the moment.",
    },
    team: [
      { name: "Luciano Carreño", href: "https://x.com/lucho_leonel1" },
      { name: "Fabián Díaz", href: "https://x.com/Fabian_diaz222" },
      { name: "Lendoor", href: "https://x.com/LendoorProtocol" },
    ],
    copy: {
      es: {
        title: "SAMI",
        body: "Juego de chat donde humanos cazan al infiltrado de IA (y la IA se hace pasar por humano).",
        paragraphs: [
          "SAMI es un juego de chat en el que humanos tienen que encontrar al infiltrado de IA. El agente se camufla entre jugadores y con el tiempo busca ser cada vez más difícil de detectar.",
          "Está construido con TypeScript, Eliza, Next.js, Express, Supabase y un stack web3 (RainbowKit, Foundry, Wagmi, Viem).",
        ],
        awards: "Sin premios formales.",
      },
      en: {
        title: "SAMI",
        body: "Chatroom game where humans hunt the AI infiltrator (and the AI pretends to be human).",
        paragraphs: [
          "SAMI is a chat game where humans have to find the AI infiltrator. The agent blends into the room and aims to get harder to spot over time.",
          "Built with TypeScript, Eliza, Next.js, Express, Supabase, and a web3 stack (RainbowKit, Foundry, Wagmi, Viem).",
        ],
        awards: "No formal awards.",
      },
    },
  },
  {
    id: "punksociety",
    icon: "/projects/punksociety.svg",
    github: "https://github.com/luloxi/PunkSociety",
    status: "disabled",
    disabledReason: {
      es: "Proyecto de hackathon (3er lugar Avalanche Summit 2024). No se mantiene una instancia en vivo.",
      en: "Hackathon project (3rd place Avalanche Summit 2024). No live instance is maintained.",
    },
    team: [{ name: "Solo" }],
    copy: {
      es: {
        title: "PunkSociety",
        body: "Red social on-chain: cada post es un NFT y los likes envían valor al creador.",
        paragraphs: [
          "PunkSociety es una red social on-chain: cada post es un NFT y los likes envían valor (USDC) al creador. La idea es alinear atención con ownership y pagos directos.",
          "Lo construí con Scaffold-ETH 2, Foundry y Next.js.",
        ],
        awards: "3er lugar · Avalanche Summit Hackathon 2024.",
      },
      en: {
        title: "PunkSociety",
        body: "On-chain social network: every post is an NFT and likes send value to the creator.",
        paragraphs: [
          "PunkSociety is an on-chain social network: every post is an NFT and likes send value (USDC) to the creator. The point is aligning attention with ownership and direct payments.",
          "I built it with Scaffold-ETH 2, Foundry, and Next.js.",
        ],
        awards: "3rd place · Avalanche Summit Hackathon 2024.",
      },
    },
  },
];

export const pastProjectIds = pastProjects.map((p) => p.id);

export const focusTopicIds: string[] = focusTopics.map((t) => t.id);

