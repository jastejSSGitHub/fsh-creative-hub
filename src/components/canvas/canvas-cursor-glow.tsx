"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";

import { useCanvasCursorGlow } from "@/hooks/use-canvas-cursor-glow";
import type { CanvasViewport } from "@/lib/canvas/viewport";

const GLOW_RADIUS_PX = 148;

const glowMaskStyle: CSSProperties = {
  maskImage: `radial-gradient(circle ${GLOW_RADIUS_PX}px at var(--glow-x) var(--glow-y), black 0%, transparent 72%)`,
  WebkitMaskImage: `radial-gradient(circle ${GLOW_RADIUS_PX}px at var(--glow-x) var(--glow-y), black 0%, transparent 72%)`,
};

type CanvasCursorGlowProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  viewport: CanvasViewport;
};

export function CanvasCursorGlow({ containerRef, viewport }: CanvasCursorGlowProps) {
  const glowStateRef = useCanvasCursorGlow(containerRef);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const brightDotsRef = useRef<HTMLDivElement>(null);

  const dotSize = 24 * viewport.zoom;
  const dotBackground = `${viewport.x}px ${viewport.y}px`;

  useEffect(() => {
    const brightDots = brightDotsRef.current;
    if (!brightDots) return;

    brightDots.style.backgroundSize = `${dotSize}px ${dotSize}px`;
    brightDots.style.backgroundPosition = dotBackground;
  }, [dotBackground, dotSize]);

  useEffect(() => {
    let frameId = 0;

    function tick() {
      const { x, y, opacity } = glowStateRef.current;

      for (const layer of [spotlightRef.current, brightDotsRef.current]) {
        if (!layer) continue;
        layer.style.setProperty("--glow-x", `${x}px`);
        layer.style.setProperty("--glow-y", `${y}px`);
        layer.style.opacity = String(opacity);
      }

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [glowStateRef]);

  return (
    <>
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          ...glowMaskStyle,
          background: `radial-gradient(circle ${GLOW_RADIUS_PX}px at var(--glow-x) var(--glow-y), rgba(255,255,255,0.08) 0%, transparent 72%)`,
          willChange: "opacity",
        }}
        aria-hidden
      />

      <div
        ref={brightDotsRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          ...glowMaskStyle,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.82) 1px, transparent 1px)",
          backgroundSize: `${dotSize}px ${dotSize}px`,
          backgroundPosition: dotBackground,
          willChange: "opacity",
        }}
        aria-hidden
      />
    </>
  );
}
