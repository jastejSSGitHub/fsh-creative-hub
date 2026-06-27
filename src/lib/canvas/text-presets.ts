import type {
  CanvasFontFamily,
  CanvasTextSize,
  TextLetterSpacing,
  TextLineHeight,
} from "@/lib/canvas/types";

export const TEXT_DEFAULT_WIDTH = 280;
export const TEXT_DEFAULT_HEIGHT = 48;
export const TEXT_MIN_WIDTH = 48;
export const TEXT_MIN_HEIGHT = 24;
export const TEXT_MAX_WIDTH = 4000;
export const TEXT_MAX_HEIGHT = 4000;

export const TEXT_FONT_SIZE_PX: Record<CanvasTextSize, number> = {
  small: 14,
  medium: 18,
  large: 24,
  "extra-large": 32,
};

export const TEXT_SIZE_LABELS: Record<CanvasTextSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  "extra-large": "Extra large",
};

export const CANVAS_FONT_FAMILIES: Record<
  CanvasFontFamily,
  { label: string; preview: string; css: string }
> = {
  "geist-sans": {
    label: "Geist Sans",
    preview: "Ag",
    css: "var(--font-geist-sans), ui-sans-serif, sans-serif",
  },
  inter: {
    label: "Inter",
    preview: "Ag",
    css: "var(--font-inter), ui-sans-serif, sans-serif",
  },
  roboto: {
    label: "Roboto",
    preview: "Ag",
    css: "var(--font-roboto), ui-sans-serif, sans-serif",
  },
  "open-sans": {
    label: "Open Sans",
    preview: "Ag",
    css: "var(--font-open-sans), ui-sans-serif, sans-serif",
  },
  lora: {
    label: "Lora",
    preview: "Ag",
    css: "var(--font-lora), ui-serif, serif",
  },
  bricolage: {
    label: "Bricolage Grotesque",
    preview: "Ag",
    css: "var(--font-bricolage), ui-sans-serif, sans-serif",
  },
  "geist-mono": {
    label: "Geist Mono",
    preview: "Ag",
    css: "var(--font-geist-mono), ui-monospace, monospace",
  },
};

export const TEXT_COLOR_PRESETS = [
  { id: "white", label: "White", value: "#ffffff" },
  { id: "black", label: "Black", value: "#1a1a1a" },
  { id: "blue", label: "Blue", value: "#18a0fb" },
  { id: "purple", label: "Purple", value: "#7c3aed" },
  { id: "green", label: "Green", value: "#22c55e" },
  { id: "red", label: "Red", value: "#ef4444" },
  { id: "orange", label: "Orange", value: "#f97316" },
  { id: "yellow", label: "Yellow", value: "#facc15" },
] as const;

export const LETTER_SPACING_OPTIONS: TextLetterSpacing[] = [
  "tight",
  "normal",
  "wide",
  "wider",
];

export const LETTER_SPACING_LABELS: Record<TextLetterSpacing, string> = {
  tight: "Tight",
  normal: "Normal",
  wide: "Wide",
  wider: "Wider",
};

export const LETTER_SPACING_EM: Record<TextLetterSpacing, string> = {
  tight: "-0.03em",
  normal: "0em",
  wide: "0.06em",
  wider: "0.12em",
};

export const LINE_HEIGHT_OPTIONS: TextLineHeight[] = [
  "compact",
  "normal",
  "relaxed",
  "loose",
];

export const LINE_HEIGHT_LABELS: Record<TextLineHeight, string> = {
  compact: "Compact",
  normal: "Normal",
  relaxed: "Relaxed",
  loose: "Loose",
};

export const LINE_HEIGHT_VALUE: Record<TextLineHeight, number> = {
  compact: 1.1,
  normal: 1.35,
  relaxed: 1.6,
  loose: 2,
};
