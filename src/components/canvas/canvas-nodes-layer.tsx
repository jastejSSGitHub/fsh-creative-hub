"use client";

import { SectionNodeView } from "@/components/canvas/nodes/section-node";
import { StampNodeView } from "@/components/canvas/nodes/stamp-node";
import { StickyNoteNode } from "@/components/canvas/nodes/sticky-note-node";
import type {
  CanvasNode,
  CanvasPlacementTool,
  CanvasTextSize,
  StampId,
  StickyColorId,
} from "@/lib/canvas/types";

type CanvasNodesLayerProps = {
  nodes: CanvasNode[];
  zoom: number;
  selectedId: string | null;
  placementTool: CanvasPlacementTool;
  onSelect: (id: string | null) => void;
  onCanvasPlace: (worldX: number, worldY: number) => void;
  onStickyTextChange: (id: string, text: string) => void;
  onStickyFormatChange: (
    id: string,
    patch: {
      color?: StickyColorId;
      textSize?: CanvasTextSize;
      bold?: boolean;
      strikethrough?: boolean;
    },
  ) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onAddAdjacentSticky: (
    id: string,
    side: "top" | "right" | "bottom" | "left",
  ) => void;
  onSectionTitleChange: (id: string, title: string) => void;
};

export function CanvasNodesLayer({
  nodes,
  zoom,
  selectedId,
  placementTool,
  onSelect,
  onCanvasPlace,
  onStickyTextChange,
  onStickyFormatChange,
  onNodeDrag,
  onAddAdjacentSticky,
  onSectionTitleChange,
}: CanvasNodesLayerProps) {
  function handleLayerPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (placementTool === "select") {
      if ((event.target as HTMLElement) === event.currentTarget) {
        onSelect(null);
      }
      return;
    }

    event.stopPropagation();
    const worldX = event.clientX / zoom;
    const worldY = event.clientY / zoom;
    onCanvasPlace(worldX, worldY);
  }

  return (
    <div className="absolute left-0 top-0" onPointerDown={handleLayerPointerDown}>
      {nodes.map((node) => {
        if (node.type === "section") {
          return (
            <SectionNodeView
              key={node.id}
              node={node}
              onTitleChange={(title) => onSectionTitleChange(node.id, title)}
            />
          );
        }

        if (node.type === "sticky") {
          return (
            <StickyNoteNode
              key={node.id}
              node={node}
              selected={selectedId === node.id}
              screenScale={zoom}
              onSelect={() => onSelect(node.id)}
              onTextChange={(text) => onStickyTextChange(node.id, text)}
              onFormatChange={(patch) => onStickyFormatChange(node.id, patch)}
              onDrag={(x, y) => onNodeDrag(node.id, x, y)}
              onAddAdjacent={(side) => onAddAdjacentSticky(node.id, side)}
            />
          );
        }

        if (node.type === "stamp") {
          return (
            <StampNodeView
              key={node.id}
              node={node}
              selected={selectedId === node.id}
              screenScale={zoom}
              onSelect={() => onSelect(node.id)}
              onDrag={(x, y) => onNodeDrag(node.id, x, y)}
            />
          );
        }

        return null;
      })}

      {placementTool === "sticky" && (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white shadow-lg">
          Click anywhere to place sticky note
        </p>
      )}

      {placementTool === "stamp" && (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white shadow-lg">
          Pick a sticker, then click to place
        </p>
      )}
    </div>
  );
}
