"use client";

import { useRef, useState } from "react";

import { StickyFormatToolbar } from "@/components/canvas/sticky-format-toolbar";
import { STICKY_COLORS, STICKY_GAP, STICKY_HEIGHT, STICKY_WIDTH } from "@/lib/canvas/presets";
import type { CanvasTextSize, StickyColorId, StickyNode } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

const TEXT_SIZE_CLASS: Record<CanvasTextSize, string> = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
  "extra-large": "text-xl",
};

const DRAG_THRESHOLD_PX = 5;

type StickyNoteNodeProps = {
  node: StickyNode;
  selected: boolean;
  screenScale: number;
  onSelect: () => void;
  onTextChange: (text: string) => void;
  onFormatChange: (patch: {
    color?: StickyColorId;
    textSize?: CanvasTextSize;
    bold?: boolean;
    strikethrough?: boolean;
  }) => void;
  onDrag: (x: number, y: number) => void;
  onAddAdjacent: (side: "top" | "right" | "bottom" | "left") => void;
};

type HoverSide = "top" | "right" | "bottom" | "left" | null;

const ADJACENT_OFFSET = {
  top: { x: 0, y: -(STICKY_HEIGHT + STICKY_GAP) },
  bottom: { x: 0, y: STICKY_HEIGHT + STICKY_GAP },
  left: { x: -(STICKY_WIDTH + STICKY_GAP), y: 0 },
  right: { x: STICKY_WIDTH + STICKY_GAP, y: 0 },
} as const;

const HANDLE_POS = {
  top: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
  bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
  right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
} as const;

export function StickyNoteNode({
  node,
  selected,
  screenScale,
  onSelect,
  onTextChange,
  onFormatChange,
  onDrag,
  onAddAdjacent,
}: StickyNoteNodeProps) {
  const [hoverSide, setHoverSide] = useState<HoverSide>(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    isDragging: boolean;
  } | null>(null);

  const fill = STICKY_COLORS[node.color].fill;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-sticky-handle]")) return;
    if ((event.target as HTMLElement).closest("[data-sticky-toolbar]")) return;

    event.stopPropagation();
    onSelect();

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

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      if (selected) setHoverSide(detectSide(event));
      return;
    }

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.isDragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      drag.isDragging = true;
      setIsDragging(true);
      textareaRef.current?.blur();
    }

    if (drag.isDragging) {
      event.preventDefault();
      onDrag(
        drag.nodeX + dx / screenScale,
        drag.nodeY + dy / screenScale,
      );
      return;
    }

    if (selected) setHoverSide(detectSide(event));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      const wasDragging = drag.isDragging;
      dragRef.current = null;
      setIsDragging(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (
        !wasDragging &&
        (event.target as HTMLElement).closest("textarea") &&
        textareaRef.current
      ) {
        textareaRef.current.focus();
      }
    }
  }

  function detectSide(event: React.PointerEvent): HoverSide {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    const edge = 28;

    if (relY < edge) return "top";
    if (relY > rect.height - edge) return "bottom";
    if (relX < edge) return "left";
    if (relX > rect.width - edge) return "right";
    return null;
  }

  return (
    <>
      {selected && !isDragging && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full pb-2"
          style={{ left: node.x + node.width / 2, top: node.y }}
          data-sticky-toolbar
        >
          <StickyFormatToolbar
            color={node.color}
            textSize={node.textSize}
            bold={node.bold}
            strikethrough={node.strikethrough}
            onChange={onFormatChange}
          />
        </div>
      )}

      {hoverSide && selected && !isDragging && (
        <div
          className="pointer-events-none absolute rounded-sm border-2 border-dashed border-[#18a0fb]/50"
          style={{
            left: node.x + ADJACENT_OFFSET[hoverSide].x,
            top: node.y + ADJACENT_OFFSET[hoverSide].y,
            width: node.width,
            height: node.height,
            backgroundColor: `${fill}66`,
          }}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "absolute touch-none rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.15)]",
          selected && "ring-2 ring-[#18a0fb]",
          isDragging ? "cursor-grabbing select-none" : "cursor-grab",
        )}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          backgroundColor: fill,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          if (!dragRef.current) setHoverSide(null);
        }}
      >
        <textarea
          ref={textareaRef}
          value={node.text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type anything, @mention anyone"
          readOnly={isDragging}
          className={cn(
            "size-full resize-none bg-transparent p-3 pb-8 outline-none placeholder:text-black/35",
            TEXT_SIZE_CLASS[node.textSize],
            node.bold && "font-bold",
            node.strikethrough && "line-through",
            isDragging && "pointer-events-none",
          )}
        />

        <span className="pointer-events-none absolute bottom-2 left-3 text-[0.6875rem] text-black/45">
          {node.authorName}
        </span>

        {selected &&
          !isDragging &&
          (["top", "right", "bottom", "left"] as const).map((side) => {
            const isActive = hoverSide === side;
            return (
              <button
                key={side}
                type="button"
                data-sticky-handle
                className={cn(
                  "absolute z-10 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#18a0fb] text-xs font-bold text-white shadow-md transition-transform",
                  HANDLE_POS[side],
                  isActive && "scale-110",
                )}
                onPointerEnter={() => setHoverSide(side)}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAdjacent(side);
                }}
                aria-label={`Add sticky ${side}`}
              >
                {isActive ? "+" : "·"}
              </button>
            );
          })}
      </div>
    </>
  );
}
