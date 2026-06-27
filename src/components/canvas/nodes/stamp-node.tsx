"use client";

import { useRef, useState } from "react";

import { StampActionToolbar } from "@/components/canvas/stamp-action-toolbar";
import { CANVAS_Z } from "@/lib/canvas/node-layers";
import { STAMP_DEFS, STAMP_SIZE } from "@/lib/canvas/presets";
import type { StampId, StampNode } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

type StampVisualProps = {
  stampId: StampId;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function StampVisual({
  stampId,
  size = STAMP_SIZE,
  className,
  style,
}: StampVisualProps) {
  const def = STAMP_DEFS[stampId];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-[3px] border-white text-2xl shadow-[0_6px_20px_rgba(0,0,0,0.22)]",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: def.ring,
        ...style,
      }}
      aria-hidden
    >
      {def.emoji}
    </div>
  );
}

type StampPlacementGhostProps = {
  stampId: StampId;
  worldX: number;
  worldY: number;
  magnetic?: boolean;
};

export function StampPlacementGhost({
  stampId,
  worldX,
  worldY,
  magnetic = false,
}: StampPlacementGhostProps) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: worldX - STAMP_SIZE / 2,
        top: worldY - STAMP_SIZE / 2,
        zIndex: CANVAS_Z.stampGhost,
      }}
    >
      <StampVisual
        stampId={stampId}
        className={cn(
          magnetic
            ? "scale-100 opacity-100 shadow-[0_10px_32px_rgba(24,160,251,0.35)] ring-2 ring-[#18a0fb]/60"
            : "scale-105 opacity-90 shadow-[0_8px_28px_rgba(0,0,0,0.28)]",
        )}
      />
    </div>
  );
}

type StampNodeViewProps = {
  node: StampNode;
  selected: boolean;
  showToolbar?: boolean;
  screenScale: number;
  interactionDisabled?: boolean;
  magneticActive?: boolean;
  onSelect: (options?: { additive?: boolean }) => void;
  onDragStart?: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function StampNodeView({
  node,
  selected,
  showToolbar = selected,
  screenScale,
  interactionDisabled = false,
  magneticActive = false,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
  onDuplicate,
  onDelete,
}: StampNodeViewProps) {
  const def = STAMP_DEFS[node.stampId];
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    isDragging: boolean;
  } | null>(null);

  return (
    <>
      {showToolbar && !isDragging && !interactionDisabled && (
        <div
          className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-full pb-2"
          style={{ left: node.x + node.width / 2, top: node.y }}
        >
          <StampActionToolbar onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      )}

      <button
        type="button"
        data-canvas-node
        className={cn(
          "pointer-events-auto absolute touch-none transition-shadow",
          selected && "ring-2 ring-[#18a0fb] ring-offset-2 rounded-full",
          magneticActive && "ring-[#18a0fb]/70",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          interactionDisabled && "pointer-events-none",
        )}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          zIndex: CANVAS_Z.stamp,
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-stamp-toolbar]")) return;

          event.stopPropagation();
          onSelect({ additive: event.shiftKey });
          dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            nodeX: node.x,
            nodeY: node.y,
            isDragging: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;

          const dx = event.clientX - dragRef.current.startX;
          const dy = event.clientY - dragRef.current.startY;

          if (
            !dragRef.current.isDragging &&
            Math.hypot(dx, dy) >= 5
          ) {
            dragRef.current.isDragging = true;
            setIsDragging(true);
            onDragStart?.();
          }

          if (dragRef.current.isDragging) {
            onDrag(
              dragRef.current.nodeX + dx / screenScale,
              dragRef.current.nodeY + dy / screenScale,
            );
          }
        }}
        onPointerUp={(event) => {
          const wasDragging = dragRef.current?.isDragging ?? false;
          dragRef.current = null;
          setIsDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          if (wasDragging) {
            onDragEnd();
          }
        }}
        onPointerCancel={(event) => {
          const wasDragging = dragRef.current?.isDragging ?? false;
          dragRef.current = null;
          setIsDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          if (wasDragging) {
            onDragEnd();
          }
        }}
        aria-label={def.label}
      >
        <StampVisual
          stampId={node.stampId}
          size={node.width}
          className={cn(
            magneticActive &&
              "shadow-[0_10px_32px_rgba(24,160,251,0.35)] ring-2 ring-[#18a0fb]/60",
          )}
        />
      </button>
    </>
  );
}
