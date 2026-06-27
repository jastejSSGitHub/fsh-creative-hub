"use client";

import { useRef, useState } from "react";

import {
  computeResizeRect,
  getResizeClampHits,
  RESIZE_HANDLE_CURSORS,
  RESIZE_HANDLES,
  resizeHandlePosition,
  type ResizeClampHit,
  type ResizeHandle,
  type ResizeRect,
} from "@/lib/canvas/resize";
import { cn } from "@/lib/utils";

type CanvasResizeHandlesProps = {
  screenScale: number;
  bounds: {
    minWidth: number;
    minHeight: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  rect: ResizeRect;
  onResize: (rect: ResizeRect) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onBoundsHit?: (hits: ResizeClampHit[]) => void;
};

export function CanvasResizeHandles({
  screenScale,
  bounds,
  rect,
  onResize,
  onResizeStart,
  onResizeEnd,
  onBoundsHit,
}: CanvasResizeHandlesProps) {
  const resizeRef = useRef<{
    handle: ResizeHandle;
    pointerId: number;
    startPointerX: number;
    startPointerY: number;
    origin: ResizeRect;
  } | null>(null);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);

  const cornerSize = Math.max(6, 7 / screenScale);
  const edgeThickness = Math.max(2, 3 / screenScale);
  const edgeHit = Math.max(6, 8 / screenScale);
  const edgeSpan = "36%";

  function handlePointerDown(
    handle: ResizeHandle,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
    event.preventDefault();

    resizeRef.current = {
      handle,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      origin: rect,
    };
    setActiveHandle(handle);
    onResizeStart?.();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const session = resizeRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    event.stopPropagation();
    event.preventDefault();

    const deltaX = (event.clientX - session.startPointerX) / screenScale;
    const deltaY = (event.clientY - session.startPointerY) / screenScale;

    const clampHits = getResizeClampHits(
      session.handle,
      session.origin,
      deltaX,
      deltaY,
      bounds,
    );
    if (clampHits.length > 0) {
      onBoundsHit?.(clampHits);
    }

    onResize(
      computeResizeRect(session.handle, session.origin, deltaX, deltaY, bounds),
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const session = resizeRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    resizeRef.current = null;
    setActiveHandle(null);
    onResizeEnd?.();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <>
      {RESIZE_HANDLES.map((handle) => {
        const isCorner = handle.length === 2;

        return (
          <button
            key={handle}
            type="button"
            aria-label={`Resize ${handle}`}
            data-canvas-resize
            onPointerDown={(event) => handlePointerDown(handle, event)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn(
              "absolute z-30 touch-none pointer-events-auto",
              isCorner
                ? cn(
                    "rounded-full border border-white bg-[#18a0fb] shadow-[0_1px_4px_rgba(24,160,251,0.35)] transition-[transform,box-shadow]",
                    activeHandle === handle &&
                      "scale-110 shadow-[0_2px_8px_rgba(24,160,251,0.5)]",
                  )
                : cn(
                    "rounded-full bg-[#18a0fb] shadow-[0_0_0_1px_rgba(255,255,255,0.85),0_1px_4px_rgba(24,160,251,0.3)] transition-[transform,box-shadow]",
                    activeHandle === handle && "scale-105 shadow-[0_0_0_1px_white,0_2px_6px_rgba(24,160,251,0.45)]",
                  ),
            )}
            style={{
              cursor: RESIZE_HANDLE_CURSORS[handle],
              ...(isCorner
                ? {
                    ...resizeHandlePosition(handle),
                    width: cornerSize,
                    height: cornerSize,
                  }
                : handle === "n"
                  ? {
                      top: 0,
                      left: edgeSpan,
                      right: edgeSpan,
                      height: edgeHit,
                      transform: "translateY(-50%)",
                      padding: `${Math.max(0, (edgeHit - edgeThickness) / 2)}px 0`,
                      backgroundClip: "content-box",
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      borderRadius: 9999,
                    }
                  : handle === "s"
                    ? {
                        bottom: 0,
                        left: edgeSpan,
                        right: edgeSpan,
                        height: edgeHit,
                        transform: "translateY(50%)",
                        padding: `${Math.max(0, (edgeHit - edgeThickness) / 2)}px 0`,
                        backgroundClip: "content-box",
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        borderRadius: 9999,
                      }
                    : handle === "e"
                      ? {
                          top: edgeSpan,
                          bottom: edgeSpan,
                          right: 0,
                          width: edgeHit,
                          transform: "translateX(50%)",
                          padding: `0 ${Math.max(0, (edgeHit - edgeThickness) / 2)}px`,
                          backgroundClip: "content-box",
                          backgroundColor: "transparent",
                          boxShadow: "none",
                          borderRadius: 9999,
                        }
                      : {
                          top: edgeSpan,
                          bottom: edgeSpan,
                          left: 0,
                          width: edgeHit,
                          transform: "translateX(-50%)",
                          padding: `0 ${Math.max(0, (edgeHit - edgeThickness) / 2)}px`,
                          backgroundClip: "content-box",
                          backgroundColor: "transparent",
                          boxShadow: "none",
                          borderRadius: 9999,
                        }),
            }}
          >
            {!isCorner ? (
              <span
                className="pointer-events-none block size-full rounded-full bg-[#18a0fb] shadow-[0_0_0_1px_rgba(255,255,255,0.85)]"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </>
  );
}
