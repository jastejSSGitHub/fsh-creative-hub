"use client";

import { useEffect, useRef, useState } from "react";

import { CANVAS_Z } from "@/lib/canvas/node-layers";
import type { ImageNode } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 5;

type ImageNodeViewProps = {
  node: ImageNode;
  selected: boolean;
  screenScale: number;
  justDropped?: boolean;
  interactionDisabled?: boolean;
  onSelect: (options?: { additive?: boolean }) => void;
  onDrag: (x: number, y: number) => void;
  onHistoryGestureStart?: () => void;
  onHistoryGestureEnd?: () => void;
};

export function ImageNodeView({
  node,
  selected,
  screenScale,
  justDropped = false,
  interactionDisabled = false,
  onSelect,
  onDrag,
  onHistoryGestureStart,
  onHistoryGestureEnd,
}: ImageNodeViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    isDragging: boolean;
  } | null>(null);

  const isUploading = node.uploadStatus === "uploading";
  const dragging = selected && isDragging && !isUploading;

  useEffect(() => {
    setImageReady(false);
  }, [node.imageUrl, isUploading]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (interactionDisabled || isUploading) return;
    event.stopPropagation();
    onSelect({ additive: event.shiftKey });
    onHistoryGestureStart?.();
    dragRef.current = {
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
    if (!drag || dragRef.current === null) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.isDragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      drag.isDragging = true;
      setIsDragging(true);
    }

    if (drag.isDragging) {
      onDrag(
        drag.nodeX + dx / screenScale,
        drag.nodeY + dy / screenScale,
      );
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    setIsDragging(false);
    onHistoryGestureEnd?.();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      data-canvas-node
      data-canvas-image={node.id}
      className={cn(
        "absolute touch-none overflow-hidden rounded-[10px] bg-white shadow-[0_10px_32px_rgba(0,0,0,0.16)]",
        selected
          ? "ring-2 ring-[#18a0fb] ring-offset-2 ring-offset-transparent"
          : "ring-1 ring-black/8",
        justDropped && "canvas-image-drop-in",
        dragging && "cursor-grabbing select-none",
        !dragging && !interactionDisabled && !isUploading && "cursor-grab",
        isUploading && "cursor-wait",
        interactionDisabled && "pointer-events-none",
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: CANVAS_Z.image,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {(isUploading || !imageReady) && (
        <div
          className="canvas-image-upload-skeleton absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-hub-skeleton-panel"
          aria-hidden={!isUploading}
        >
          <div className="hub-shimmer absolute inset-0 opacity-70" />
          {isUploading ? (
            <div className="relative z-10 flex flex-col items-center gap-2.5">
              <div
                className="canvas-image-upload-spinner size-5 rounded-full border-2 border-[#18a0fb]/25 border-t-[#18a0fb]"
                aria-hidden
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">
                Uploading
              </span>
            </div>
          ) : null}
        </div>
      )}

      {!isUploading && node.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={node.imageUrl}
          alt=""
          draggable={false}
          onLoad={() => setImageReady(true)}
          className={cn(
            "pointer-events-none size-full object-cover transition-opacity duration-300 ease-out",
            imageReady ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </div>
  );
}
