/**
 * Research topics shown on the blog editor (suggested tags) and, where the
 * about page still lists them, as external references. Not portfolio projects:
 * those live in D1 (`projects`, migration 0012) and are edited in place.
 */

export type FocusTopicId =
  | "tokenization"
  | "midnight"
  | "hermes"
  | "lcp"
  | "x402"
  | "erc8004";

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

export const focusTopicIds: string[] = focusTopics.map((t) => t.id);
