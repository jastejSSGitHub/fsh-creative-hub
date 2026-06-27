import type { CanvasNode } from "@/lib/canvas/types";

export const CANVAS_MAX_UNDO_STEPS = 20;

export type CanvasHistorySnapshot = {
  nodes: CanvasNode[];
  backgroundColor: string;
};

export function cloneCanvasHistorySnapshot(
  nodes: CanvasNode[],
  backgroundColor: string,
): CanvasHistorySnapshot {
  return {
    nodes: structuredClone(nodes),
    backgroundColor,
  };
}

export function canvasSnapshotsEqual(
  a: CanvasHistorySnapshot,
  b: CanvasHistorySnapshot,
): boolean {
  return (
    a.backgroundColor === b.backgroundColor &&
    JSON.stringify(a.nodes) === JSON.stringify(b.nodes)
  );
}
