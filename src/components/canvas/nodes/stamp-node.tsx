"use client";

import { useRef } from "react";

import { STAMP_DEFS } from "@/lib/canvas/presets";
import type { StampNode } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

type StampNodeViewProps = {
  node: StampNode;
  selected: boolean;
  screenScale: number;
  onSelect: () => void;
  onDrag: (x: number, y: number) => void;
};

export function StampNodeView({
  node,
  selected,
  screenScale,
  onSelect,
  onDrag,
}: StampNodeViewProps) {
  const def = STAMP_DEFS[node.stampId];
  const dragRef = useRef<{
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
  } | null>(null);

  return (
    <button
      type="button"
      className={cn(
        "absolute flex touch-none items-center justify-center rounded-full border-[3px] border-white text-2xl shadow-[0_6px_20px_rgba(0,0,0,0.22)] transition-shadow",
        selected && "ring-2 ring-[#18a0fb] ring-offset-2",
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: def.ring,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
        dragRef.current = {
          startX: event.clientX,
          startY: event.clientY,
          nodeX: node.x,
          nodeY: node.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragRef.current) return;
        const dx = (event.clientX - dragRef.current.startX) / screenScale;
        const dy = (event.clientY - dragRef.current.startY) / screenScale;
        onDrag(dragRef.current.nodeX + dx, dragRef.current.nodeY + dy);
      }}
      onPointerUp={(event) => {
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      aria-label={def.label}
    >
      {def.emoji}
    </button>
  );
}
