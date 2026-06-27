import type { CanvasTextSize, StickyColorId } from "@/lib/canvas/types";

const IDEA_COLOR_TO_STICKY: Record<string, StickyColorId> = {
  yellow: "yellow",
  pink: "pink",
  blue: "blue",
  green: "green",
  lavender: "purple",
  purple: "purple",
  orange: "orange",
};

const STICKY_TO_IDEA_COLOR: Record<StickyColorId, string> = {
  yellow: "yellow",
  pink: "pink",
  blue: "blue",
  green: "green",
  purple: "lavender",
  orange: "orange",
};

export function resolveIdeaStickyColor(color: string): StickyColorId {
  return IDEA_COLOR_TO_STICKY[color] ?? "yellow";
}

export function stickyColorToIdeaColor(color: StickyColorId): string {
  return STICKY_TO_IDEA_COLOR[color];
}

export function normalizeIdeaTextSize(value: string | undefined): CanvasTextSize {
  if (value === "small" || value === "large" || value === "extra-large") return value;
  return "medium";
}
