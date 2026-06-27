"use client";

import { useEffect, useRef, type RefObject } from "react";

import { clampZoom, type CanvasViewport } from "@/lib/canvas/viewport";

type UseCanvasPinchZoomOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  viewport: CanvasViewport;
  setViewport: React.Dispatch<React.SetStateAction<CanvasViewport>>;
};

function touchDistance(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function touchCenter(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
) {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  };
}

export function useCanvasPinchZoom({
  containerRef,
  enabled,
  viewport,
  setViewport,
}: UseCanvasPinchZoomOptions) {
  const pinchRef = useRef<{
    distance: number;
    zoom: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 2) {
        pinchRef.current = null;
        return;
      }

      const rect = container!.getBoundingClientRect();
      const center = touchCenter(event.touches[0], event.touches[1]);

      pinchRef.current = {
        distance: touchDistance(event.touches[0], event.touches[1]),
        zoom: viewport.zoom,
        centerX: center.x - rect.left,
        centerY: center.y - rect.top,
      };
    }

    function handleTouchMove(event: TouchEvent) {
      if (event.touches.length !== 2 || !pinchRef.current) return;

      event.preventDefault();

      const rect = container!.getBoundingClientRect();
      const center = touchCenter(event.touches[0], event.touches[1]);
      const nextDistance = touchDistance(event.touches[0], event.touches[1]);
      const scale = nextDistance / pinchRef.current.distance;
      const targetZoom = clampZoom(pinchRef.current.zoom * scale);
      const pointerX = center.x - rect.left;
      const pointerY = center.y - rect.top;

      setViewport((current) => {
        const worldX = (pointerX - current.x) / current.zoom;
        const worldY = (pointerY - current.y) / current.zoom;

        return {
          x: pointerX - worldX * targetZoom,
          y: pointerY - worldY * targetZoom,
          zoom: targetZoom,
        };
      });
    }

    function handleTouchEnd(event: TouchEvent) {
      if (event.touches.length < 2) {
        pinchRef.current = null;
      }
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [containerRef, enabled, setViewport, viewport.zoom]);
}
