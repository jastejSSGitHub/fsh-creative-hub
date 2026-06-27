import type { CanvasTheme, StampId, StickyColorId } from "@/lib/canvas/types";

export type { CanvasTheme };

export const CANVAS_BG_PRESETS = [
  { id: "charcoal", label: "Charcoal", value: "#1a1a1a", mode: "dark" as const },
  { id: "slate", label: "Slate", value: "#0f1419", mode: "dark" as const },
  { id: "warm", label: "Warm dark", value: "#1c1917", mode: "dark" as const },
  { id: "figjam", label: "FigJam light", value: "#f5f5f0", mode: "light" as const },
  { id: "paper", label: "Soft paper", value: "#faf8f3", mode: "light" as const },
] as const;

/** Default page background — always a curated dark preset until the user picks another. */
export const DEFAULT_CANVAS_BG = CANVAS_BG_PRESETS[0].value;

export function resolveCanvasBackgroundColor(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_CANVAS_BG;

  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_CANVAS_BG;

  const preset = CANVAS_BG_PRESETS.find(
    (entry) => entry.value.toLowerCase() === trimmed.toLowerCase(),
  );
  return preset?.value ?? DEFAULT_CANVAS_BG;
}

export const STICKY_COLORS: Record<
  StickyColorId,
  { fill: string; header?: string; label: string }
> = {
  yellow: { fill: "#fff9b1", label: "Yellow" },
  blue: { fill: "#dbeafe", label: "Blue" },
  green: { fill: "#dcfce7", label: "Green" },
  pink: { fill: "#fce7f3", label: "Pink" },
  purple: { fill: "#ede9fe", label: "Purple" },
  orange: { fill: "#ffedd5", label: "Orange" },
};

export const STAMP_DEFS: Record<
  StampId,
  { emoji: string; label: string; ring: string }
> = {
  "thumbs-up": { emoji: "👍", label: "Thumbs up", ring: "#22c55e" },
  heart: { emoji: "❤️", label: "Heart", ring: "#ef4444" },
  "plus-one": { emoji: "+1", label: "+1", ring: "#a855f7" },
  star: { emoji: "⭐", label: "Star", ring: "#eab308" },
  fire: { emoji: "🔥", label: "Fire", ring: "#f97316" },
  eyes: { emoji: "👀", label: "Eyes", ring: "#3b82f6" },
};

export const STICKY_WIDTH = 200;
export const STICKY_HEIGHT = 200;

/** One grid unit — default sticky is 2×2 units (200×200). */
export const STICKY_UNIT = 100;

/** Minimum resize width: one grid unit (half the default). */
export const STICKY_MIN_WIDTH = STICKY_UNIT;

/**
 * Minimum resize height: ~two text lines, author strip, and padding
 * (matches p-3 + pb-8 + text-base line-height × 2).
 */
export const STICKY_MIN_HEIGHT = 88;

export const STICKY_MAX_WIDTH = STICKY_WIDTH * 2;
export const STICKY_MAX_HEIGHT = STICKY_HEIGHT * 2;
/** Minimum gap between adjacent sticky notes when using + handles. */
export const STICKY_GAP = 16;
export const STAMP_SIZE = 56;
export const EMBED_WIDTH = 420;
export const EMBED_HEIGHT = 280;
export const EMBED_MIN_WIDTH = 240;
export const EMBED_MIN_HEIGHT = 160;
export const EMBED_MAX_WIDTH = 1600;
export const EMBED_MAX_HEIGHT = 1200;
export const EMBED_HEADER_HEIGHT = 40;
export const IMAGE_DEFAULT_MAX_WIDTH = 320;
export const IMAGE_DEFAULT_MAX_HEIGHT = 320;
export const IMAGE_PLACEMENT_GAP = 16;
export const IMAGE_DROP_STAGGER = 24;

export function getCanvasTheme(backgroundColor: string): CanvasTheme {
  const preset = CANVAS_BG_PRESETS.find((p) => p.value === backgroundColor);
  const isLight = preset?.mode === "light";

  if (isLight) {
    return {
      mode: "light",
      chromeText: "text-[#1a1a1a]",
      chromeMuted: "text-[#1a1a1a]/55",
      glassBorder: "border-white/70",
      glassBg: "bg-[rgba(255,255,255,0.52)]",
      dotOpacity: 0.62,
      vignette:
        "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.06)_100%)]",
    };
  }

  return {
    mode: "dark",
    chromeText: "text-white",
    chromeMuted: "text-white/55",
    glassBorder: "border-white/[0.12]",
    glassBg: "bg-[rgba(32,32,32,0.68)]",
    dotOpacity: 0.5,
    vignette:
      "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.18)_100%)]",
  };
}

export function isLightCanvasBackground(backgroundColor: string): boolean {
  return getCanvasTheme(backgroundColor).mode === "light";
}
