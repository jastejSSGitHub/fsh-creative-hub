import { resolveCanvasBackgroundColor } from "@/lib/canvas/presets";
import type { CanvasConfigV1, CanvasNode } from "@/lib/canvas/types";
import { CANVAS_DEFAULT_ZOOM, clampZoom } from "@/lib/canvas/viewport";

export function parseCanvasConfig(
  raw: Record<string, unknown> | undefined,
): CanvasConfigV1 {
  const nodes = Array.isArray(raw?.nodes)
    ? (raw.nodes as CanvasNode[])
    : [];

  const viewportRaw = raw?.viewport;
  let viewport = { x: 0, y: 0, zoom: CANVAS_DEFAULT_ZOOM };
  if (
    viewportRaw &&
    typeof viewportRaw === "object" &&
    "x" in viewportRaw &&
    "y" in viewportRaw &&
    "zoom" in viewportRaw
  ) {
    const v = viewportRaw as { x: unknown; y: unknown; zoom: unknown };
    viewport = {
      x: typeof v.x === "number" ? v.x : 0,
      y: typeof v.y === "number" ? v.y : 0,
      zoom: clampZoom(typeof v.zoom === "number" ? v.zoom : CANVAS_DEFAULT_ZOOM),
    };
  }

  return {
    version: 1,
    nodes,
    viewport,
    backgroundColor: resolveCanvasBackgroundColor(raw?.backgroundColor),
    templateApplied:
      typeof raw?.templateApplied === "string" ? raw.templateApplied : undefined,
    onboardingCompleted: raw?.onboardingCompleted === true,
    zoomTipsSeen: raw?.zoomTipsSeen === true,
  };
}
