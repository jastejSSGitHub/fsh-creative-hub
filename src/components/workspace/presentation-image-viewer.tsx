"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Transform = {
  scale: number;
  x: number;
  y: number;
};

type PresentationImageViewerProps = {
  src: string;
  alt: string;
  swipeThresholdPx?: number;
  onSwipePrev?: () => void;
  onSwipeNext?: () => void;
  onInteract?: () => void;
  className?: string;
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_ZOOM = 2.25;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function touchDistance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function touchMidpoint(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  };
}

function clampTransform(
  transform: Transform,
  containerWidth: number,
  containerHeight: number,
): Transform {
  if (transform.scale <= 1) {
    return { scale: 1, x: 0, y: 0 };
  }

  const maxX = (containerWidth * (transform.scale - 1)) / 2;
  const maxY = (containerHeight * (transform.scale - 1)) / 2;

  return {
    scale: transform.scale,
    x: clamp(transform.x, -maxX, maxX),
    y: clamp(transform.y, -maxY, maxY),
  };
}

function zoomAroundPoint(
  current: Transform,
  nextScale: number,
  focalX: number,
  focalY: number,
  containerWidth: number,
  containerHeight: number,
): Transform {
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  if (scale === 1) {
    return { scale: 1, x: 0, y: 0 };
  }

  const originX = focalX - containerWidth / 2;
  const originY = focalY - containerHeight / 2;
  const ratio = scale / current.scale;

  return clampTransform(
    {
      scale,
      x: originX - ratio * (originX - current.x),
      y: originY - ratio * (originY - current.y),
    },
    containerWidth,
    containerHeight,
  );
}

export function PresentationImageViewer({
  src,
  alt,
  swipeThresholdPx = 48,
  onSwipePrev,
  onSwipeNext,
  onInteract,
  className,
}: PresentationImageViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0 });
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null,
  );
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{
    distance: number;
    scale: number;
    x: number;
    y: number;
    focalX: number;
    focalY: number;
  } | null>(null);
  const lastTapRef = useRef<number>(0);

  const applyTransform = useCallback((next: Transform) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      transformRef.current = next;
      setTransform(next);
      return;
    }

    const clamped = clampTransform(
      next,
      viewport.clientWidth,
      viewport.clientHeight,
    );
    transformRef.current = clamped;
    setTransform(clamped);
  }, []);

  useEffect(() => {
    applyTransform({ scale: 1, x: 0, y: 0 });
  }, [src, applyTransform]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onInteract?.();

      const rect = viewport.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const delta = event.deltaY > 0 ? -0.12 : 0.12;
      const current = transformRef.current;
      const nextScale = current.scale + delta * Math.max(1, current.scale * 0.35);

      applyTransform(
        zoomAroundPoint(
          current,
          nextScale,
          point.x,
          point.y,
          viewport.clientWidth,
          viewport.clientHeight,
        ),
      );
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [applyTransform, onInteract, src]);

  const getLocalPoint = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleDoubleTap = useCallback(
    (clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const point = getLocalPoint(clientX, clientY);
      const current = transformRef.current;

      if (current.scale > 1.05) {
        applyTransform({ scale: 1, x: 0, y: 0 });
        return;
      }

      applyTransform(
        zoomAroundPoint(
          current,
          DOUBLE_TAP_ZOOM,
          point.x,
          point.y,
          viewport.clientWidth,
          viewport.clientHeight,
        ),
      );
    },
    [applyTransform, getLocalPoint],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onInteract?.();

      if (event.pointerType === "touch") return;

      const current = transformRef.current;
      if (current.scale <= 1) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        tx: current.x,
        ty: current.y,
      };
      setIsDragging(true);
    },
    [onInteract],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const panStart = panStartRef.current;
      if (!panStart) return;

      applyTransform({
        ...transformRef.current,
        x: panStart.tx + (event.clientX - panStart.x),
        y: panStart.ty + (event.clientY - panStart.y),
      });
    },
    [applyTransform],
  );

  const finishPointerPan = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!panStartRef.current) return;
      panStartRef.current = null;
      setIsDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      applyTransform(transformRef.current);
    },
    [applyTransform],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      onInteract?.();

      if (event.touches.length === 2) {
        swipeStartRef.current = null;
        panStartRef.current = null;

        const viewport = viewportRef.current;
        if (!viewport) return;

        const mid = touchMidpoint(event.touches[0]!, event.touches[1]!);
        const local = getLocalPoint(mid.x, mid.y);
        const current = transformRef.current;

        pinchStartRef.current = {
          distance: touchDistance(event.touches[0]!, event.touches[1]!),
          scale: current.scale,
          x: current.x,
          y: current.y,
          focalX: local.x,
          focalY: local.y,
        };
        setIsPinching(true);
        return;
      }

      if (event.touches.length === 1) {
        pinchStartRef.current = null;
        const touch = event.touches[0]!;
        const current = transformRef.current;

        if (current.scale > 1) {
          swipeStartRef.current = null;
          panStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            tx: current.x,
            ty: current.y,
          };
          setIsDragging(true);
          return;
        }

        swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    [getLocalPoint, onInteract],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2 && pinchStartRef.current) {
        event.preventDefault();

        const viewport = viewportRef.current;
        if (!viewport) return;

        const mid = touchMidpoint(event.touches[0]!, event.touches[1]!);
        const local = getLocalPoint(mid.x, mid.y);
        const start = pinchStartRef.current;
        const distance = touchDistance(event.touches[0]!, event.touches[1]!);
        const nextScale = start.scale * (distance / start.distance);

        applyTransform(
          zoomAroundPoint(
            { scale: start.scale, x: start.x, y: start.y },
            nextScale,
            local.x,
            local.y,
            viewport.clientWidth,
            viewport.clientHeight,
          ),
        );
        return;
      }

      if (event.touches.length === 1 && panStartRef.current) {
        event.preventDefault();
        const touch = event.touches[0]!;
        const panStart = panStartRef.current;

        applyTransform({
          ...transformRef.current,
          x: panStart.tx + (touch.clientX - panStart.x),
          y: panStart.ty + (touch.clientY - panStart.y),
        });
      }
    },
    [applyTransform, getLocalPoint],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (pinchStartRef.current && event.touches.length < 2) {
        pinchStartRef.current = null;
        setIsPinching(false);
        applyTransform(transformRef.current);
      }

      if (panStartRef.current && event.touches.length === 0) {
        panStartRef.current = null;
        setIsDragging(false);
        applyTransform(transformRef.current);
      }

      if (swipeStartRef.current && event.changedTouches.length === 1) {
        const touch = event.changedTouches[0]!;
        const deltaX = touch.clientX - swipeStartRef.current.x;
        const deltaY = touch.clientY - swipeStartRef.current.y;
        swipeStartRef.current = null;

        if (
          transformRef.current.scale <= 1 &&
          Math.abs(deltaX) > swipeThresholdPx &&
          Math.abs(deltaX) > Math.abs(deltaY) * 1.2
        ) {
          if (deltaX > 0) onSwipePrev?.();
          else onSwipeNext?.();
        }
      }

      if (event.touches.length === 0) {
        const now = Date.now();
        const touch = event.changedTouches[0];
        if (touch && now - lastTapRef.current < DOUBLE_TAP_MS) {
          handleDoubleTap(touch.clientX, touch.clientY);
          lastTapRef.current = 0;
        } else if (touch) {
          lastTapRef.current = now;
        }
      }
    },
    [
      applyTransform,
      handleDoubleTap,
      onSwipeNext,
      onSwipePrev,
      swipeThresholdPx,
    ],
  );

  const isZoomed = transform.scale > 1.01;

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative flex max-h-[calc(100dvh-5rem)] max-w-full touch-none select-none items-center justify-center overflow-hidden",
        isZoomed ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerPan}
      onPointerCancel={finishPointerPan}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={(event) => handleDoubleTap(event.clientX, event.clientY)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-full max-w-full object-contain will-change-transform"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transition: isDragging || isPinching ? "none" : "transform 0.18s ease-out",
        }}
      />

      {isZoomed && (
        <button
          type="button"
          onClick={() => applyTransform({ scale: 1, x: 0, y: 0 })}
          className="pointer-events-auto absolute bottom-3 right-3 z-10 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/80 backdrop-blur-md transition-colors hover:bg-white/15 sm:bottom-4 sm:right-4"
        >
          Reset zoom
        </button>
      )}
    </div>
  );
}
