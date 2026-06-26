export type HeroVerb = {
  word: string;
  pillBg: string;
  dot: string;
};

export const HERO_VERBS: HeroVerb[] = [
  { word: "Gather", pillBg: "#F0EBE3", dot: "#8B7355" },
  { word: "Critique", pillBg: "#EDE9FE", dot: "#7B2CBF" },
  { word: "Align", pillBg: "#CCFBF1", dot: "#2A9D8F" },
  { word: "Greenlight", pillBg: "#DCFCE7", dot: "#22c55e" },
  { word: "Spotlight", pillBg: "#FEE2E2", dot: "#E85D4C" },
  { word: "Finalize", pillBg: "#FEF3C7", dot: "#ffc94b" },
];

export const HERO_VERB_INTERVAL_MS = 2800;
