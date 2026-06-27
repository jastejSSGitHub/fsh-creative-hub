"use client";

import { useEffect, useRef, useState } from "react";

import { CanvasNodeContextMenu } from "@/components/canvas/canvas-node-context-menu";
import { CanvasResizeHandles } from "@/components/canvas/nodes/canvas-resize-handles";
import {
  TextFormatToolbar,
  type TextFormatPatch,
} from "@/components/canvas/text-format-toolbar";
import {
  CANVAS_FONT_FAMILIES,
  LETTER_SPACING_EM,
  LINE_HEIGHT_VALUE,
  TEXT_FONT_SIZE_PX,
  TEXT_MAX_HEIGHT,
  TEXT_MAX_WIDTH,
  TEXT_MIN_HEIGHT,
  TEXT_MIN_WIDTH,
} from "@/lib/canvas/text-presets";
import { CANVAS_Z } from "@/lib/canvas/node-layers";
import type { TextNode } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 5;

type TextNodeViewProps = {
  node: TextNode;
  selected: boolean;
  showToolbar?: boolean;
  screenScale: number;
  interactionDisabled?: boolean;
  autoFocus?: boolean;
  onSelect: (options?: { additive?: boolean }) => void;
  onTextChange: (text: string) => void;
  onFormatChange: (patch: TextFormatPatch) => void;
  onUpdate: (patch: Partial<Pick<TextNode, "x" | "y" | "width" | "height">>) => void;
  onDrag: (x: number, y: number) => void;
  onDelete: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onAutoFocusHandled?: () => void;
  onHistoryGestureStart?: () => void;
  onHistoryGestureEnd?: () => void;
};

export function TextNodeView({
  node,
  selected,
  showToolbar = selected,
  screenScale,
  interactionDisabled = false,
  autoFocus = false,
  onSelect,
  onTextChange,
  onFormatChange,
  onUpdate,
  onDrag,
  onDelete,
  onCopy,
  onDuplicate,
  onAutoFocusHandled,
  onHistoryGestureStart,
  onHistoryGestureEnd,
}: TextNodeViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    isDragging: boolean;
  } | null>(null);

  const fontStack = CANVAS_FONT_FAMILIES[node.fontFamily].css;
  const fontSize = TEXT_FONT_SIZE_PX[node.textSize];
  const lineHeight = LINE_HEIGHT_VALUE[node.lineHeight];

  useEffect(() => {
    if (!autoFocus) return;
    setIsEditing(true);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
      onAutoFocusHandled?.();
    });
  }, [autoFocus, onAutoFocusHandled]);

  useEffect(() => {
    if (selected && isEditing) {
      textareaRef.current?.focus();
    }
  }, [selected, isEditing]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isResizing) return;
    if ((event.target as HTMLElement).closest("[data-text-toolbar]")) return;
    if ((event.target as HTMLElement).closest("[data-text-toolbar-popover]")) return;
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
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.isDragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      drag.isDragging = true;
      setIsDragging(true);
      setIsEditing(false);
      textareaRef.current?.blur();
    }

    if (drag.isDragging) {
      event.preventDefault();
      onDrag(
        drag.nodeX + dx / screenScale,
        drag.nodeY + dy / screenScale,
      );
    }
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
        setIsEditing(true);
        textareaRef.current.focus();
      }
    }
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect({ additive: event.shiftKey });
    setIsEditing(true);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const length = node.text.length;
      textareaRef.current?.setSelectionRange(length, length);
    });
  }

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    onSelect({ additive: event.shiftKey });
    setContextMenu({ x: event.clientX, y: event.clientY });
  }

  const textTransform = node.uppercase
    ? "uppercase"
    : node.lowercase
      ? "lowercase"
      : "none";

  const alignClass =
    node.align === "center"
      ? "text-center"
      : node.align === "right"
        ? "text-right"
        : "text-left";

  const resizing = selected && isResizing;

  return (
    <>
      {showToolbar && !isDragging && !isResizing && !interactionDisabled && (
        <div
          className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-full pb-2"
          style={{ left: node.x + node.width / 2, top: node.y }}
          data-text-toolbar
          onPointerDown={(event) => event.stopPropagation()}
        >
          <TextFormatToolbar
            color={node.color}
            fontFamily={node.fontFamily}
            textSize={node.textSize}
            align={node.align}
            bold={node.bold}
            italic={node.italic}
            underline={node.underline}
            uppercase={node.uppercase}
            lowercase={node.lowercase}
            onChange={onFormatChange}
            onCopy={onCopy}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      )}

      {contextMenu ? (
        <CanvasNodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onCopy={() => {
            onCopy();
            setContextMenu(null);
          }}
          onDuplicate={() => {
            onDuplicate();
            setContextMenu(null);
          }}
          onDelete={() => {
            onDelete();
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      ) : null}

      <div
        data-canvas-node
        data-canvas-text={node.id}
        className={cn(
          "absolute touch-none overflow-visible",
          selected && "ring-2 ring-[#18a0fb] ring-offset-2 ring-offset-transparent",
          isDragging
            ? "cursor-grabbing select-none"
            : resizing
              ? "cursor-default select-none"
              : isEditing
                ? "cursor-text"
                : "cursor-grab",
          interactionDisabled && "pointer-events-none",
        )}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          zIndex: CANVAS_Z.text,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <textarea
          ref={textareaRef}
          value={node.text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Add text"
          readOnly={isDragging || isResizing || (selected && !isEditing)}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          onPointerDown={(event) => {
            if (isEditing) event.stopPropagation();
          }}
          className={cn(
            "size-full resize-none overflow-hidden bg-transparent p-1.5 outline-none placeholder:text-current placeholder:opacity-35",
            alignClass,
            node.bold && "font-bold",
            node.italic && "italic",
            node.underline && "underline",
            (isDragging || isResizing || !isEditing) && "pointer-events-none",
          )}
          style={{
            color: node.color,
            fontFamily: fontStack,
            fontSize,
            lineHeight,
            letterSpacing: LETTER_SPACING_EM[node.letterSpacing],
            textTransform,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        />

        {selected && !isDragging ? (
          <div data-canvas-resize className="pointer-events-none absolute inset-0">
            <CanvasResizeHandles
              screenScale={screenScale}
              bounds={{
                minWidth: TEXT_MIN_WIDTH,
                minHeight: TEXT_MIN_HEIGHT,
                maxWidth: TEXT_MAX_WIDTH,
                maxHeight: TEXT_MAX_HEIGHT,
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
                setIsEditing(false);
                textareaRef.current?.blur();
              }}
              onResizeEnd={() => {
                setIsResizing(false);
                onHistoryGestureEnd?.();
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
