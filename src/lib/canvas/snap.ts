import { STICKY_HEIGHT, STICKY_WIDTH } from "@/lib/canvas/presets";
import type { CanvasNode, SectionNode } from "@/lib/canvas/types";

const GRID = 24;
const SNAP_PADDING = 32;

export function snapStickyToSection(
  x: number,
  y: number,
  sections: SectionNode[],
): { x: number; y: number; sectionId?: string; snapped: boolean } {
  for (const section of sections) {
    const innerLeft = section.x + SNAP_PADDING;
    const innerTop = section.y + 72 + SNAP_PADDING;
    const innerRight = section.x + section.width - SNAP_PADDING - STICKY_WIDTH;
    const innerBottom =
      section.y + section.height - SNAP_PADDING - STICKY_HEIGHT;

    if (
      x >= innerLeft - 40 &&
      x <= innerRight + 40 &&
      y >= innerTop - 40 &&
      y <= innerBottom + 40
    ) {
      const snappedX = Math.round(
        Math.min(Math.max(x, innerLeft), innerRight) / GRID,
      ) * GRID;
      const snappedY = Math.round(
        Math.min(Math.max(y, innerTop), innerBottom) / GRID,
      ) * GRID;

      return {
        x: snappedX,
        y: snappedY,
        sectionId: section.id,
        snapped: true,
      };
    }
  }

  return {
    x: Math.round(x / GRID) * GRID,
    y: Math.round(y / GRID) * GRID,
    snapped: false,
  };
}

export function getSectionNodes(nodes: CanvasNode[]): SectionNode[] {
  return nodes.filter((n): n is SectionNode => n.type === "section");
}
