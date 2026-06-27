export type CanvasViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CanvasTool = "select" | "hand";

export {
  CANVAS_BG_PRESETS,
  DEFAULT_CANVAS_BG,
} from "@/lib/canvas/presets";

export const CANVAS_MIN_ZOOM = 0.05;
export const CANVAS_MAX_ZOOM = 4;
export const CANVAS_DEFAULT_ZOOM = 1;
export const CANVAS_WORLD_ORIGIN = { x: 0, y: 0 };

export function clampZoom(zoom: number): number {
  return Math.min(CANVAS_MAX_ZOOM, Math.max(CANVAS_MIN_ZOOM, zoom));
}

export function parseViewport(config: Record<string, unknown> | undefined): CanvasViewport {
  const viewport = config?.viewport;
  if (
    viewport &&
    typeof viewport === "object" &&
    "x" in viewport &&
    "y" in viewport &&
    "zoom" in viewport
  ) {
    const v = viewport as { x: unknown; y: unknown; zoom: unknown };
    return {
      x: typeof v.x === "number" ? v.x : 0,
      y: typeof v.y === "number" ? v.y : 0,
      zoom: clampZoom(typeof v.zoom === "number" ? v.zoom : CANVAS_DEFAULT_ZOOM),
    };
  }
  return { x: 0, y: 0, zoom: CANVAS_DEFAULT_ZOOM };
}

export function zoomAtPoint(
  viewport: CanvasViewport,
  deltaY: number,
  pointerX: number,
  pointerY: number,
  sensitivity = 0.0012,
): CanvasViewport {
  const zoomFactor = Math.exp(-deltaY * sensitivity);
  const newZoom = clampZoom(viewport.zoom * zoomFactor);
  const worldX = (pointerX - viewport.x) / viewport.zoom;
  const worldY = (pointerY - viewport.y) / viewport.zoom;

  return {
    x: pointerX - worldX * newZoom,
    y: pointerY - worldY * newZoom,
    zoom: newZoom,
  };
}

export function panViewport(
  viewport: CanvasViewport,
  deltaX: number,
  deltaY: number,
): CanvasViewport {
  return {
    ...viewport,
    x: viewport.x + deltaX,
    y: viewport.y + deltaY,
  };
}

export function centerOnWorldPoint(
  viewport: CanvasViewport,
  worldX: number,
  worldY: number,
  containerWidth: number,
  containerHeight: number,
  zoom = viewport.zoom,
): CanvasViewport {
  const clampedZoom = clampZoom(zoom);
  return {
    x: containerWidth / 2 - worldX * clampedZoom,
    y: containerHeight / 2 - worldY * clampedZoom,
    zoom: clampedZoom,
  };
}

export function formatZoomPercent(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

/** Comfortable zoom for reading/editing inline canvas text (100%). */
export const TEXT_EDIT_TARGET_ZOOM = 1;

export function focusViewportOnWorldPoint(
  viewport: CanvasViewport,
  worldX: number,
  worldY: number,
  containerWidth: number,
  containerHeight: number,
  targetZoom = TEXT_EDIT_TARGET_ZOOM,
): CanvasViewport {
  const zoom = clampZoom(Math.max(viewport.zoom, targetZoom));
  return centerOnWorldPoint(
    viewport,
    worldX,
    worldY,
    containerWidth,
    containerHeight,
    zoom,
  );
}
