"use client";

import { CANVAS_Z } from "@/lib/canvas/node-layers";
import {
  IMAGE_DEFAULT_MAX_HEIGHT,
  IMAGE_DEFAULT_MAX_WIDTH,
} from "@/lib/canvas/presets";

type CanvasFileDropGhostProps = {
  worldX: number;
  worldY: number;
};

export function CanvasFileDropGhost({ worldX, worldY }: CanvasFileDropGhostProps) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: worldX - IMAGE_DEFAULT_MAX_WIDTH / 2,
        top: worldY - IMAGE_DEFAULT_MAX_HEIGHT / 2,
        width: IMAGE_DEFAULT_MAX_WIDTH,
        height: IMAGE_DEFAULT_MAX_HEIGHT,
        zIndex: CANVAS_Z.imageGhost,
      }}
    >
      <div className="canvas-image-drop-ghost size-full rounded-[10px] border-2 border-dashed border-[#18a0fb]/75 bg-white/80 shadow-[0_16px_48px_rgba(24,160,251,0.22)] ring-2 ring-[#18a0fb]/15" />
    </div>
  );
}
