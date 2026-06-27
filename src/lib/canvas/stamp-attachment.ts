import type { StickyNode } from "@/lib/canvas/types";

export type CanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Small tolerance so edge-adjacent stamps still count as touching. */
const TOUCH_TOLERANCE_PX = 4;

/** How close (px) a stamp center can be to a sticky before magnetism kicks in. */
export const STAMP_MAGNETIC_RADIUS = 52;

export type Point = { x: number; y: number };

export type StampMagnetism = {
  stickyId: string;
  center: Point;
};

function distancePointToRect(px: number, py: number, rect: CanvasRect): number {
  const closestX = Math.max(rect.x, Math.min(px, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(py, rect.y + rect.height));
  return Math.hypot(px - closestX, py - closestY);
}

/** Snap stamp center so the sticker rests on the nearest sticky edge or corner. */
export function snapStampCenterToSticky(
  center: Point,
  sticky: CanvasRect,
  stampSize: number,
): Point {
  const half = stampSize / 2;
  const overlap = TOUCH_TOLERANCE_PX;

  const minCenterX = sticky.x + half - overlap;
  const maxCenterX = sticky.x + sticky.width - half + overlap;
  const minCenterY = sticky.y + half - overlap;
  const maxCenterY = sticky.y + sticky.height - half + overlap;

  let x = center.x;
  let y = center.y;

  if (center.x < sticky.x) {
    x = sticky.x - half + overlap;
  } else if (center.x > sticky.x + sticky.width) {
    x = sticky.x + sticky.width + half - overlap;
  } else {
    x = Math.max(minCenterX, Math.min(center.x, maxCenterX));
  }

  if (center.y < sticky.y) {
    y = sticky.y - half + overlap;
  } else if (center.y > sticky.y + sticky.height) {
    y = sticky.y + sticky.height + half - overlap;
  } else {
    y = Math.max(minCenterY, Math.min(center.y, maxCenterY));
  }

  return { x, y };
}

export function resolveStampMagnetism(
  center: Point,
  stickies: StickyNode[],
  stampSize: number,
): StampMagnetism | null {
  let best: (StampMagnetism & { distance: number }) | null = null;

  for (const sticky of stickies) {
    const distance = distancePointToRect(center.x, center.y, sticky);
    if (distance > STAMP_MAGNETIC_RADIUS) continue;

    const snapped = snapStampCenterToSticky(center, sticky, stampSize);
    if (!best || distance < best.distance) {
      best = { stickyId: sticky.id, center: snapped, distance };
    }
  }

  if (!best) return null;
  return { stickyId: best.stickyId, center: best.center };
}

export function resolveStampPlacement(
  center: Point,
  stickies: StickyNode[],
  stampSize: number,
): Point {
  return resolveStampMagnetism(center, stickies, stampSize)?.center ?? center;
}

export function rectsTouch(a: CanvasRect, b: CanvasRect): boolean {
  return (
    a.x - TOUCH_TOLERANCE_PX < b.x + b.width + TOUCH_TOLERANCE_PX &&
    a.x + a.width + TOUCH_TOLERANCE_PX > b.x - TOUCH_TOLERANCE_PX &&
    a.y - TOUCH_TOLERANCE_PX < b.y + b.height + TOUCH_TOLERANCE_PX &&
    a.y + a.height + TOUCH_TOLERANCE_PX > b.y - TOUCH_TOLERANCE_PX
  );
}

function overlapArea(a: CanvasRect, b: CanvasRect): number {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

export function getStickyNodes(nodes: { type: string }[]): StickyNode[] {
  return nodes.filter((node): node is StickyNode => node.type === "sticky");
}

export function findAttachedStickyId(
  stamp: CanvasRect,
  stickies: StickyNode[],
): string | undefined {
  let bestId: string | undefined;
  let bestScore = -1;

  for (const sticky of stickies) {
    if (!rectsTouch(stamp, sticky)) continue;

    const area = overlapArea(stamp, sticky);
    const score = area > 0 ? area : 1;

    if (score > bestScore) {
      bestScore = score;
      bestId = sticky.id;
    }
  }

  return bestId;
}
