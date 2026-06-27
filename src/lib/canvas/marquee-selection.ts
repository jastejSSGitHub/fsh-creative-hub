import type { CanvasNode } from "@/lib/canvas/types";

export type WorldRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function normalizeWorldRect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): WorldRect {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    width: Math.abs(bx - ax),
    height: Math.abs(by - ay),
  };
}

export function rectsIntersect(a: WorldRect, b: WorldRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function nodeWorldRect(node: CanvasNode): WorldRect {
  return {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };
}

export function findNodesInMarquee(
  nodes: CanvasNode[],
  marquee: WorldRect,
): string[] {
  if (marquee.width < 1 && marquee.height < 1) return [];

  return nodes
    .filter((node) => node.type !== "section")
    .filter((node) => rectsIntersect(marquee, nodeWorldRect(node)))
    .map((node) => node.id);
}
