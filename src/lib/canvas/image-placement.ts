import { IMAGE_PLACEMENT_GAP } from "@/lib/canvas/presets";
import type { CanvasNode } from "@/lib/canvas/types";

export type CanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function expandRect(rect: CanvasRect, gap: number): CanvasRect {
  return {
    x: rect.x - gap,
    y: rect.y - gap,
    width: rect.width + gap * 2,
    height: rect.height + gap * 2,
  };
}

export function rectsOverlap(a: CanvasRect, b: CanvasRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function nodeObstacleRect(node: CanvasNode, gap: number): CanvasRect {
  return expandRect(
    { x: node.x, y: node.y, width: node.width, height: node.height },
    gap,
  );
}

const SPIRAL_OFFSETS: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
  [2, 0],
  [0, 2],
  [-2, 0],
  [0, -2],
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
];

/** Finds the nearest non-overlapping top-left position for a new image. */
export function resolveImagePlacement(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  nodes: CanvasNode[],
  excludeId?: string,
): { x: number; y: number } {
  const gap = IMAGE_PLACEMENT_GAP;
  const step = gap + 12;
  const obstacles = nodes
    .filter((node) => node.id !== excludeId)
    .map((node) => nodeObstacleRect(node, gap));

  const preferredX = centerX - width / 2;
  const preferredY = centerY - height / 2;

  function isFree(x: number, y: number) {
    const candidate = { x, y, width, height };
    return !obstacles.some((obstacle) => rectsOverlap(candidate, obstacle));
  }

  for (const [ox, oy] of SPIRAL_OFFSETS) {
    const x = preferredX + ox * step;
    const y = preferredY + oy * step;
    if (isFree(x, y)) return { x, y };
  }

  for (let ring = 3; ring <= 20; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
        const x = preferredX + dx * step;
        const y = preferredY + dy * step;
        if (isFree(x, y)) return { x, y };
      }
    }
  }

  return {
    x: preferredX + step * 3,
    y: preferredY + step * 3,
  };
}
