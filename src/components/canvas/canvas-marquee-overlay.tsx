"use client";

import { CANVAS_Z } from "@/lib/canvas/node-layers";
import type { WorldRect } from "@/lib/canvas/marquee-selection";

type CanvasMarqueeOverlayProps = {
  rect: WorldRect;
};

export function CanvasMarqueeOverlay({ rect }: CanvasMarqueeOverlayProps) {
  if (rect.width < 1 && rect.height < 1) return null;

  return (
    <div
      aria-hidden
      data-canvas-marquee
      className="pointer-events-none absolute border border-[#18a0fb] bg-[#18a0fb]/20"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: CANVAS_Z.marquee,
      }}
    />
  );
}
