import type { CanvasNode } from "@/lib/canvas/types";

const CONTENT_PAD = 96;
export const EMBEDDED_CANVAS_MIN_HEIGHT = 480;

export function computeCanvasContentHeight(
  nodes: CanvasNode[],
  zoom = 1,
  minHeight = EMBEDDED_CANVAS_MIN_HEIGHT,
): number {
  if (nodes.length === 0) return minHeight;

  let maxBottom = 0;
  for (const node of nodes) {
    maxBottom = Math.max(maxBottom, node.y + node.height);
  }

  return Math.max(minHeight, Math.ceil((maxBottom + CONTENT_PAD) * zoom));
}

export function countCanvasStickyNodes(nodes: CanvasNode[]): number {
  return nodes.filter((node) => node.type === "sticky").length;
}
