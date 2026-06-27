"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { CanvasResizeHandles } from "@/components/canvas/nodes/canvas-resize-handles";
import { StickyFormatToolbar } from "@/components/canvas/sticky-format-toolbar";
import {
  STICKY_COLORS,
  STICKY_GAP,
  STICKY_MAX_HEIGHT,
  STICKY_MAX_WIDTH,
  STICKY_MIN_HEIGHT,
  STICKY_MIN_WIDTH,
} from "@/lib/canvas/presets";
import {
  measureStickyTextHeight,
  stickyTextWouldOverflow,
} from "@/lib/canvas/sticky-auto-size";
import { CANVAS_Z } from "@/lib/canvas/node-layers";
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
  showToolbar?: boolean;
  screenScale: number;
  interactionDisabled?: boolean;
  magneticActive?: boolean;
  onSelect: (options?: { additive?: boolean }) => void;
  onTextChange: (text: string) => void;
  onFormatChange: (patch: {
    color?: StickyColorId;
    textSize?: CanvasTextSize;
    bold?: boolean;
    strikethrough?: boolean;
  }) => void;
  onDrag: (x: number, y: number) => void;
  onUpdate: (patch: Partial<Pick<StickyNode, "x" | "y" | "width" | "height">>) => void;
  onAddAdjacent: (side: "top" | "right" | "bottom" | "left") => void;
  onAddLink: () => void;
  onDelete: () => void;
  onHistoryGestureStart?: () => void;
  onHistoryGestureEnd?: () => void;
};

type HoverSide = "top" | "right" | "bottom" | "left" | null;

const ADJACENT_OFFSET = {
  top: (w: number, h: number) => ({ x: 0, y: -(h + STICKY_GAP) }),
  bottom: (w: number, h: number) => ({ x: 0, y: h + STICKY_GAP }),
  left: (w: number, h: number) => ({ x: -(w + STICKY_GAP), y: 0 }),
  right: (w: number, h: number) => ({ x: w + STICKY_GAP, y: 0 }),
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
  showToolbar = selected,
  screenScale,
  interactionDisabled = false,
  magneticActive = false,
  onSelect,
  onTextChange,
  onFormatChange,
  onDrag,
  onUpdate,
  onAddAdjacent,
  onAddLink,
  onDelete,
  onHistoryGestureStart,
  onHistoryGestureEnd,
}: StickyNoteNodeProps) {
  const [hoverSide, setHoverSide] = useState<HoverSide>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [limitFlash, setLimitFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const limitFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    isDragging: boolean;
  } | null>(null);

  const fill = STICKY_COLORS[node.color].fill;
  const resizing = selected && isResizing;

  const triggerLimitFlash = useCallback(() => {
    setLimitFlash(true);
    if (limitFlashTimerRef.current) clearTimeout(limitFlashTimerRef.current);
    limitFlashTimerRef.current = setTimeout(() => setLimitFlash(false), 450);
  }, []);

  const syncHeightFromContent = useCallback(() => {
    if (isResizing) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const nextHeight = measureStickyTextHeight(textarea);
    if (nextHeight > node.height) {
      onUpdate({ height: nextHeight });
    }
  }, [isResizing, node.height, onUpdate]);

  useLayoutEffect(() => {
    syncHeightFromContent();
  }, [
    node.text,
    node.width,
    node.textSize,
    node.bold,
    node.strikethrough,
    syncHeightFromContent,
  ]);

  const handleTextChange = useCallback(
    (nextText: string) => {
      const textarea = textareaRef.current;

      if (
        textarea &&
        nextText.length > node.text.length &&
        stickyTextWouldOverflow(textarea, nextText)
      ) {
        triggerLimitFlash();
        return;
      }

      onTextChange(nextText);
    },
    [node.text.length, onTextChange, triggerLimitFlash],
  );

  const insertEmojiAtCursor = useCallback(
    (emoji: string) => {
      const textarea = textareaRef.current;
      const text = node.text;

      if (!textarea) {
        onTextChange(text + emoji);
        return;
      }

      const start = textarea.selectionStart ?? text.length;
      const end = textarea.selectionEnd ?? text.length;
      const next = text.slice(0, start) + emoji + text.slice(end);

      if (stickyTextWouldOverflow(textarea, next)) {
        triggerLimitFlash();
        return;
      }

      onTextChange(next);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursor = start + emoji.length;
        textarea.setSelectionRange(cursor, cursor);
      });
    },
    [node.text, onTextChange, triggerLimitFlash],
  );

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isResizing) return;
    if ((event.target as HTMLElement).closest("[data-sticky-handle]")) return;
    if ((event.target as HTMLElement).closest("[data-sticky-toolbar]")) return;
    if ((event.target as HTMLElement).closest("[data-canvas-resize]")) return;

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

      onHistoryGestureEnd?.();

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
      {showToolbar && !isDragging && !isResizing && !interactionDisabled && (
        <div
          className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-full pb-2"
          style={{ left: node.x + node.width / 2, top: node.y }}
          data-sticky-toolbar
          onPointerDown={(event) => event.stopPropagation()}
        >
          <StickyFormatToolbar
            color={node.color}
            textSize={node.textSize}
            bold={node.bold}
            strikethrough={node.strikethrough}
            onChange={onFormatChange}
            onInsertEmoji={insertEmojiAtCursor}
            onAddLink={onAddLink}
            onDelete={onDelete}
          />
        </div>
      )}

      {hoverSide && selected && !isDragging && !isResizing && (
        <div
          className="pointer-events-none absolute rounded-sm border-2 border-dashed border-[#18a0fb]/50"
          style={{
            left: node.x + ADJACENT_OFFSET[hoverSide](node.width, node.height).x,
            top: node.y + ADJACENT_OFFSET[hoverSide](node.width, node.height).y,
            width: node.width,
            height: node.height,
            backgroundColor: `${fill}66`,
          }}
          aria-hidden
        />
      )}

      <div
        data-canvas-node
        data-canvas-sticky={node.id}
        className={cn(
          "absolute touch-none overflow-visible rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.15)]",
          selected &&
            (limitFlash
              ? "ring-2 ring-red-500 transition-shadow duration-150"
              : "ring-2 ring-[#18a0fb]"),
          magneticActive && "canvas-sticky-wiggle canvas-sticky-magnetic z-[21]",
          isDragging
            ? "cursor-grabbing select-none"
            : resizing
              ? "cursor-default select-none"
              : "cursor-grab",
          interactionDisabled && "pointer-events-none",
        )}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          backgroundColor: fill,
          zIndex: CANVAS_Z.sticky,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          if (!dragRef.current) setHoverSide(null);
        }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-sm">
        <textarea
          ref={textareaRef}
          value={node.text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Type anything, @mention anyone"
          readOnly={isDragging || resizing}
          className={cn(
            "size-full resize-none overflow-hidden bg-transparent p-3 pb-8 outline-none placeholder:text-black/35",
            TEXT_SIZE_CLASS[node.textSize],
            node.bold && "font-bold",
            node.strikethrough && "line-through",
            (isDragging || resizing) && "pointer-events-none",
          )}
        />

        <span className="pointer-events-none absolute bottom-2 left-3 text-[0.6875rem] text-black/45">
          {node.authorName}
        </span>
        </div>

        {selected &&
          !isDragging &&
          !isResizing &&
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

        {selected && !isDragging ? (
          <div data-canvas-resize className="pointer-events-none absolute inset-0">
            <CanvasResizeHandles
              screenScale={screenScale}
              bounds={{
                minWidth: STICKY_MIN_WIDTH,
                minHeight: STICKY_MIN_HEIGHT,
                maxWidth: STICKY_MAX_WIDTH,
                maxHeight: STICKY_MAX_HEIGHT,
              }}
              rect={{
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
              }}
              onResizeStart={() => {
                onHistoryGestureStart?.();
                setIsResizing(true);
                textareaRef.current?.blur();
              }}
              onResizeEnd={() => {
                setIsResizing(false);
                onHistoryGestureEnd?.();
                requestAnimationFrame(() => syncHeightFromContent());
              }}
              onBoundsHit={(hits) => {
                if (
                  hits.some(
                    (hit) =>
                      hit === "maxWidth" ||
                      hit === "maxHeight" ||
                      hit === "minWidth" ||
                      hit === "minHeight",
                  )
                ) {
                  triggerLimitFlash();
                }
              }}
              onResize={(rect) =>
                onUpdate({
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                })
              }
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
