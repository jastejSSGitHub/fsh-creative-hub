"use client";

import { useRef, useState } from "react";

import { CANVAS_Z } from "@/lib/canvas/node-layers";
import type { SectionNode } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 5;

type SectionNodeViewProps = {
  node: SectionNode;
  selected: boolean;
  screenScale: number;
  interactionDisabled?: boolean;
  onSelect: (options?: { additive?: boolean }) => void;
  onTitleChange: (title: string) => void;
  onDrag: (x: number, y: number) => void;
  onHistoryGestureStart?: () => void;
  onHistoryGestureEnd?: () => void;
};

export function SectionNodeView({
  node,
  selected,
  screenScale,
  interactionDisabled = false,
  onSelect,
  onTitleChange,
  onDrag,
  onHistoryGestureStart,
  onHistoryGestureEnd,
}: SectionNodeViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    isDragging: boolean;
  } | null>(null);

  function handleHeaderPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect({ additive: event.shiftKey });
    onHistoryGestureStart?.();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      nodeX: node.x,
      nodeY: node.y,
      isDragging: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleHeaderPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.isDragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      drag.isDragging = true;
      setIsDragging(true);
      titleRef.current?.blur();
    }

    if (drag.isDragging) {
      event.preventDefault();
      onDrag(
        drag.nodeX + dx / screenScale,
        drag.nodeY + dy / screenScale,
      );
    }
  }

  function handleHeaderPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;

    const wasDragging = drag.isDragging;
    dragRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onHistoryGestureEnd?.();

    if (
      !wasDragging &&
      (event.target as HTMLElement).closest("input") &&
      titleRef.current
    ) {
      titleRef.current.focus();
    }
  }

  return (
    <div
      data-canvas-node
      className={cn(
        "pointer-events-none absolute overflow-hidden rounded-lg shadow-lg",
        selected && "ring-2 ring-[#18a0fb]",
        interactionDisabled && "pointer-events-none",
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: node.fillColor,
        border: `2px solid ${node.accentColor}`,
        zIndex: CANVAS_Z.section,
      }}
    >
      <div
        className={cn(
          "pointer-events-auto touch-none px-4 py-3",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{ backgroundColor: node.accentColor }}
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerUp}
      >
        <input
          ref={titleRef}
          type="text"
          value={node.title}
          onChange={(e) => onTitleChange(e.target.value)}
          readOnly={isDragging}
          className={cn(
            "w-full bg-transparent font-display text-xl font-extrabold text-white outline-none placeholder:text-white/60",
            isDragging && "pointer-events-none select-none",
          )}
          placeholder="How might we _________?"
        />
      </div>

      <span
        className="pointer-events-none absolute left-3 top-[3.25rem] rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium text-white"
        style={{ backgroundColor: node.accentColor }}
      >
        {node.subtitle}
      </span>

      <div
        className="pointer-events-none absolute left-8 top-24 size-[200px] rounded-sm border-2 border-dashed opacity-40"
        style={{ borderColor: node.accentColor }}
        aria-hidden
      />
    </div>
  );
}
