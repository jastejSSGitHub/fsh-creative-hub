"use client";

import { useMemo, useState } from "react";

import { CanvasBackgroundContextMenu } from "@/components/canvas/canvas-background-context-menu";
import { CanvasFileDropGhost } from "@/components/canvas/canvas-file-drop-ghost";
import { CanvasMarqueeOverlay } from "@/components/canvas/canvas-marquee-overlay";
import { EmbedNodeView } from "@/components/canvas/nodes/embed-node";
import { EmbedPlacementGhost } from "@/components/canvas/nodes/embed-placement-ghost";
import { ImageNodeView } from "@/components/canvas/nodes/image-node";
import { SectionNodeView } from "@/components/canvas/nodes/section-node";
import { StampNodeView, StampPlacementGhost } from "@/components/canvas/nodes/stamp-node";
import { StickyNoteNode } from "@/components/canvas/nodes/sticky-note-node";
import { TextNodeView } from "@/components/canvas/nodes/text-node";
import type { TextFormatPatch } from "@/components/canvas/text-format-toolbar";
import { partitionCanvasNodes, isStampPlacementActive, CANVAS_Z } from "@/lib/canvas/node-layers";
import type { WorldRect } from "@/lib/canvas/marquee-selection";
import { STAMP_SIZE } from "@/lib/canvas/presets";
import { getStickyNodes, resolveStampMagnetism } from "@/lib/canvas/stamp-attachment";
import type {
  CanvasNode,
  CanvasPlacementTool,
  CanvasTextSize,
  EmbedNode,
  ImageNode,
  SectionNode,
  StampId,
  StampNode,
  StickyColorId,
  StickyNode,
  TextNode,
} from "@/lib/canvas/types";

type CanvasNodesLayerProps = {
  nodes: CanvasNode[];
  zoom: number;
  selectedIds: string[];
  marqueeRect?: WorldRect | null;
  placementTool: CanvasPlacementTool;
  viewportTool?: "select" | "hand";
  pendingStampId?: StampId | null;
  stampPreviewWorld?: { x: number; y: number } | null;
  embedPreviewWorld?: { x: number; y: number } | null;
  fileDropPreviewWorld?: { x: number; y: number } | null;
  recentDropIds?: string[];
  onSelectNode: (id: string, options?: { additive?: boolean }) => void;
  onSelectNodes: (ids: string[], options?: { additive?: boolean }) => void;
  onClearSelection: () => void;
  onCanvasPlace: (worldX: number, worldY: number, clientX?: number, clientY?: number) => void;
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  onStartEmbedPlacement: () => void;
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
  onEmbedUpdate: (id: string, patch: Partial<EmbedNode>) => void;
  onStickyUpdate: (id: string, patch: Partial<Pick<StickyNode, "x" | "y" | "width" | "height">>) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onNodeDelete: (id: string) => void;
  onStampDragEnd: (id: string) => void;
  onStampDuplicate: (id: string) => void;
  onSectionDrag: (id: string, x: number, y: number) => void;
  onAddAdjacentSticky: (
    id: string,
    side: "top" | "right" | "bottom" | "left",
  ) => void;
  onSectionTitleChange: (id: string, title: string) => void;
  focusTextId?: string | null;
  onFocusTextHandled?: () => void;
  onTextChange: (id: string, text: string) => void;
  onTextFormatChange: (id: string, patch: TextFormatPatch) => void;
  onTextUpdate: (
    id: string,
    patch: Partial<Pick<TextNode, "x" | "y" | "width" | "height">>,
  ) => void;
  onTextCopy: (id: string) => void;
  onTextDuplicate: (id: string) => void;
  onEmbedDuplicate: (id: string) => void;
  onHistoryGestureStart?: () => void;
  onHistoryGestureEnd?: () => void;
  canPasteClipboard?: () => boolean;
  onPasteAt?: (worldX: number, worldY: number) => void;
};

export function CanvasNodesLayer({
  nodes,
  zoom,
  selectedIds,
  marqueeRect = null,
  placementTool,
  viewportTool = "select",
  pendingStampId,
  stampPreviewWorld,
  embedPreviewWorld,
  fileDropPreviewWorld,
  recentDropIds = [],
  onSelectNode,
  onSelectNodes,
  onClearSelection,
  onCanvasPlace,
  clientToWorld,
  onStartEmbedPlacement,
  onStickyTextChange,
  onStickyFormatChange,
  onEmbedUpdate,
  onStickyUpdate,
  onNodeDrag,
  onNodeDelete,
  onStampDragEnd,
  onStampDuplicate,
  onSectionDrag,
  onAddAdjacentSticky,
  onSectionTitleChange,
  focusTextId,
  onFocusTextHandled,
  onTextChange,
  onTextFormatChange,
  onTextUpdate,
  onTextCopy,
  onTextDuplicate,
  onEmbedDuplicate,
  onHistoryGestureStart,
  onHistoryGestureEnd,
  canPasteClipboard,
  onPasteAt,
}: CanvasNodesLayerProps) {
  const { sections, stickies, texts, embeds, images, stamps } = partitionCanvasNodes(nodes);
  const stampPlacementActive = isStampPlacementActive(placementTool, pendingStampId);
  const stickyNodes = stickies as StickyNode[];
  const [draggingStampId, setDraggingStampId] = useState<string | null>(null);
  const [backgroundMenu, setBackgroundMenu] = useState<{
    x: number;
    y: number;
    worldX: number;
    worldY: number;
  } | null>(null);

  const stampMagnetism = useMemo(() => {
    if (stampPlacementActive && stampPreviewWorld) {
      return resolveStampMagnetism(stampPreviewWorld, stickyNodes, STAMP_SIZE);
    }

    if (draggingStampId) {
      const stamp = stamps.find((node) => node.id === draggingStampId);
      if (!stamp) return null;

      const center = {
        x: stamp.x + stamp.width / 2,
        y: stamp.y + stamp.height / 2,
      };
      return resolveStampMagnetism(center, stickyNodes, STAMP_SIZE);
    }

    return null;
  }, [
    stampPlacementActive,
    stampPreviewWorld,
    draggingStampId,
    stamps,
    stickyNodes,
  ]);

  const stampPreviewPosition = stampMagnetism?.center ?? stampPreviewWorld;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const isOnlySelected = (id: string) =>
    selectedIds.length === 1 && selectedIds[0] === id;

  function handleLayerPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (placementTool !== "select") {
      event.stopPropagation();
      const { x: worldX, y: worldY } = clientToWorld(event.clientX, event.clientY);
      onCanvasPlace(worldX, worldY, event.clientX, event.clientY);
    }
  }

  function handleLayerContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "[data-sticky-toolbar], [data-sticky-toolbar-popover], [data-text-toolbar], [data-text-toolbar-popover], [data-stamp-toolbar], [data-embed-toolbar], [data-embed-interactive]",
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const { x: worldX, y: worldY } = clientToWorld(event.clientX, event.clientY);
    setBackgroundMenu({
      x: event.clientX,
      y: event.clientY,
      worldX,
      worldY,
    });
  }

  return (
    <div
      data-canvas-background
      className="absolute inset-0"
      style={{ minWidth: "100%", minHeight: "100%" }}
      onPointerDown={handleLayerPointerDown}
      onContextMenu={handleLayerContextMenu}
    >
      {sections.map((node) => (
        <SectionNodeView
          key={node.id}
          node={node as SectionNode}
          selected={selectedSet.has(node.id)}
          screenScale={zoom}
          interactionDisabled={stampPlacementActive}
          onSelect={(options) => onSelectNode(node.id, options)}
          onTitleChange={(title) => onSectionTitleChange(node.id, title)}
          onDrag={(x, y) => onSectionDrag(node.id, x, y)}
          onHistoryGestureStart={onHistoryGestureStart}
          onHistoryGestureEnd={onHistoryGestureEnd}
        />
      ))}

      {stickies.map((node) => (
        <StickyNoteNode
          key={node.id}
          node={node as StickyNode}
          selected={selectedSet.has(node.id)}
          showToolbar={isOnlySelected(node.id)}
          screenScale={zoom}
          interactionDisabled={stampPlacementActive}
          magneticActive={stampMagnetism?.stickyId === node.id}
          onSelect={(options) => onSelectNode(node.id, options)}
          onTextChange={(text) => onStickyTextChange(node.id, text)}
          onFormatChange={(patch) => onStickyFormatChange(node.id, patch)}
          onDrag={(x, y) => onNodeDrag(node.id, x, y)}
          onUpdate={(patch) => onStickyUpdate(node.id, patch)}
          onAddAdjacent={(side) => onAddAdjacentSticky(node.id, side)}
          onAddLink={onStartEmbedPlacement}
          onDelete={() => onNodeDelete(node.id)}
          onHistoryGestureStart={onHistoryGestureStart}
          onHistoryGestureEnd={onHistoryGestureEnd}
        />
      ))}

      {texts.map((node) => (
        <TextNodeView
          key={node.id}
          node={node as TextNode}
          selected={selectedSet.has(node.id)}
          showToolbar={isOnlySelected(node.id)}
          screenScale={zoom}
          interactionDisabled={stampPlacementActive}
          autoFocus={focusTextId === node.id}
          onAutoFocusHandled={onFocusTextHandled}
          onSelect={(options) => onSelectNode(node.id, options)}
          onTextChange={(text) => onTextChange(node.id, text)}
          onFormatChange={(patch) => onTextFormatChange(node.id, patch)}
          onUpdate={(patch) => onTextUpdate(node.id, patch)}
          onDrag={(x, y) => onNodeDrag(node.id, x, y)}
          onDelete={() => onNodeDelete(node.id)}
          onCopy={() => onTextCopy(node.id)}
          onDuplicate={() => onTextDuplicate(node.id)}
          onHistoryGestureStart={onHistoryGestureStart}
          onHistoryGestureEnd={onHistoryGestureEnd}
        />
      ))}

      {embeds.map((node) => (
        <EmbedNodeView
          key={node.id}
          node={node as EmbedNode}
          selected={selectedSet.has(node.id)}
          showToolbar={isOnlySelected(node.id)}
          screenScale={zoom}
          interactionDisabled={stampPlacementActive}
          onSelect={(options) => onSelectNode(node.id, options)}
          onUpdate={(patch) => onEmbedUpdate(node.id, patch)}
          onDrag={(x, y) => onNodeDrag(node.id, x, y)}
          onDuplicate={() => onEmbedDuplicate(node.id)}
          onDelete={() => onNodeDelete(node.id)}
          onHistoryGestureStart={onHistoryGestureStart}
          onHistoryGestureEnd={onHistoryGestureEnd}
        />
      ))}

      {images.map((node) => (
        <ImageNodeView
          key={node.id}
          node={node as ImageNode}
          selected={selectedSet.has(node.id)}
          screenScale={zoom}
          justDropped={recentDropIds.includes(node.id)}
          interactionDisabled={stampPlacementActive}
          onSelect={(options) => onSelectNode(node.id, options)}
          onDrag={(x, y) => onNodeDrag(node.id, x, y)}
          onHistoryGestureStart={onHistoryGestureStart}
          onHistoryGestureEnd={onHistoryGestureEnd}
        />
      ))}

      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: CANVAS_Z.stampLayer }}
      >
        {stamps.map((node) => (
          <StampNodeView
            key={node.id}
            node={node as StampNode}
            selected={selectedSet.has(node.id)}
            showToolbar={isOnlySelected(node.id)}
            screenScale={zoom}
            interactionDisabled={stampPlacementActive}
            magneticActive={
              draggingStampId === node.id && Boolean(stampMagnetism)
            }
            onSelect={(options) => onSelectNode(node.id, options)}
            onDragStart={() => {
              onHistoryGestureStart?.();
              setDraggingStampId(node.id);
            }}
            onDrag={(x, y) => onNodeDrag(node.id, x, y)}
            onDragEnd={() => {
              setDraggingStampId(null);
              onHistoryGestureEnd?.();
              onStampDragEnd(node.id);
            }}
            onDuplicate={() => onStampDuplicate(node.id)}
            onDelete={() => onNodeDelete(node.id)}
          />
        ))}
      </div>

      {pendingStampId && stampPreviewPosition ? (
        <StampPlacementGhost
          stampId={pendingStampId}
          worldX={stampPreviewPosition.x}
          worldY={stampPreviewPosition.y}
          magnetic={Boolean(stampMagnetism)}
        />
      ) : null}

      {placementTool === "embed" && embedPreviewWorld ? (
        <EmbedPlacementGhost
          worldX={embedPreviewWorld.x}
          worldY={embedPreviewWorld.y}
        />
      ) : null}

      {fileDropPreviewWorld ? (
        <CanvasFileDropGhost
          worldX={fileDropPreviewWorld.x}
          worldY={fileDropPreviewWorld.y}
        />
      ) : null}

      {placementTool === "text" && (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white shadow-lg">
          Click anywhere to add text
        </p>
      )}

      {placementTool === "sticky" && (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white shadow-lg">
          Click anywhere to place sticky note
        </p>
      )}

      {placementTool === "stamp" && (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {pendingStampId
            ? stampMagnetism
              ? "Release to stick on note"
              : "Click to place sticker"
            : "Pick a sticker, then click to place"}
        </p>
      )}

      {placementTool === "embed" && (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white shadow-lg">
          Click to place link embed
        </p>
      )}

      {marqueeRect ? <CanvasMarqueeOverlay rect={marqueeRect} /> : null}

      {backgroundMenu ? (
        <CanvasBackgroundContextMenu
          x={backgroundMenu.x}
          y={backgroundMenu.y}
          canPaste={canPasteClipboard?.() ?? false}
          onPaste={() => onPasteAt?.(backgroundMenu.worldX, backgroundMenu.worldY)}
          onClose={() => setBackgroundMenu(null)}
        />
      ) : null}
    </div>
  );
}
