"use client";

import { CanvasCursorGlow } from "@/components/canvas/canvas-cursor-glow";
import type { CanvasTheme } from "@/lib/canvas/presets";
import type { CanvasViewport } from "@/lib/canvas/viewport";
import { cn } from "@/lib/utils";

type CanvasViewportSurfaceProps = {
  viewport: CanvasViewport;
  backgroundColor: string;
  theme: CanvasTheme;
  cursor: string;
  showEmptyState: boolean;
  onDismissEmptyState: () => void;
  nodesLayer?: React.ReactNode;
  handlers: {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  };
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export function CanvasViewportSurface({
  viewport,
  backgroundColor,
  theme,
  cursor,
  handlers,
  containerRef,
  nodesLayer,
}: CanvasViewportSurfaceProps) {
  const dotColor =
    theme.mode === "light" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.22)";

  return (
    <div
      ref={containerRef}
      className="relative h-[100dvh] w-full touch-none select-none overflow-hidden"
      style={{ cursor, backgroundColor }}
      {...handlers}
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: theme.dotOpacity,
          backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
        aria-hidden
      />

      <CanvasCursorGlow containerRef={containerRef} viewport={viewport} />

      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {nodesLayer}
      </div>

      <div className={cn("pointer-events-none absolute inset-0", theme.vignette)} aria-hidden />
    </div>
  );
}
