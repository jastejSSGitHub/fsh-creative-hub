"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  CANVAS_WORLD_ORIGIN,
  centerOnWorldPoint,
  clampZoom,
  panViewport,
  type CanvasTool,
  type CanvasViewport,
  zoomAtPoint,
} from "@/lib/canvas/viewport";

type UseCanvasViewportOptions = {
  initialViewport: CanvasViewport;
};

export function useCanvasViewport({ initialViewport }: UseCanvasViewportOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<CanvasViewport>(initialViewport);
  const [tool, setTool] = useState<CanvasTool>("select");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const centerOnOrigin = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setViewport((current) =>
      centerOnWorldPoint(
        current,
        CANVAS_WORLD_ORIGIN.x,
        CANVAS_WORLD_ORIGIN.y,
        rect.width,
        rect.height,
        current.zoom,
      ),
    );
  }, []);

  const resetView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setViewport((current) =>
      centerOnWorldPoint(
        current,
        CANVAS_WORLD_ORIGIN.x,
        CANVAS_WORLD_ORIGIN.y,
        rect.width,
        rect.height,
        1,
      ),
    );
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setViewport((current) => {
      const newZoom = clampZoom(current.zoom * factor);
      const worldX = (centerX - current.x) / current.zoom;
      const worldY = (centerY - current.y) / current.zoom;
      return {
        x: centerX - worldX * newZoom,
        y: centerY - worldY * newZoom,
        zoom: newZoom,
      };
    });
  }, []);

  const zoomIn = useCallback(() => zoomBy(1.15), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / 1.15), [zoomBy]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function applyCenter(zoom = initialViewport.zoom) {
      const rect = container!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      setViewport(
        centerOnWorldPoint(
          initialViewport,
          CANVAS_WORLD_ORIGIN.x,
          CANVAS_WORLD_ORIGIN.y,
          rect.width,
          rect.height,
          zoom,
        ),
      );
      return true;
    }

    if (applyCenter()) return;

    const observer = new ResizeObserver(() => {
      if (applyCenter()) observer.disconnect();
    });
    observer.observe(container);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- center once on mount
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        setSpaceHeld(true);
      }
      if (event.key === "v" || event.key === "V") setTool("select");
      if (event.key === "h" || event.key === "H") setTool("hand");
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        setSpaceHeld(false);
        isPanningRef.current = false;
        setIsPanning(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const shouldPan = useCallback(
    (button: number) => {
      if (button === 1) return true;
      if (spaceHeld) return true;
      return tool === "hand" && button === 0;
    },
    [spaceHeld, tool],
  );

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    if (event.ctrlKey || event.metaKey) {
      setViewport((current) => zoomAtPoint(current, event.deltaY, pointerX, pointerY));
      return;
    }

    setViewport((current) => panViewport(current, -event.deltaX, -event.deltaY));
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!shouldPan(event.button)) return;
      isPanningRef.current = true;
      setIsPanning(true);
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [shouldPan],
  );

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const deltaX = event.clientX - lastPointerRef.current.x;
    const deltaY = event.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    setViewport((current) => panViewport(current, deltaX, deltaY));
  }, []);

  const stopPanning = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const cursor =
    tool === "hand" || spaceHeld
      ? isPanning
        ? "grabbing"
        : "grab"
      : "default";

  return {
    containerRef,
    viewport,
    setViewport,
    tool,
    setTool,
    centerOnOrigin,
    resetView,
    zoomIn,
    zoomOut,
    cursor,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: stopPanning,
      onPointerCancel: stopPanning,
    },
  };
}
