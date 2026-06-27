"use client";

import { CANVAS_Z } from "@/lib/canvas/node-layers";
import { EMBED_HEIGHT, EMBED_WIDTH } from "@/lib/canvas/presets";
import { EmbedEmptyState } from "@/components/canvas/nodes/embed-empty-state";

type EmbedPlacementGhostProps = {
  worldX: number;
  worldY: number;
};

export function EmbedPlacementGhost({ worldX, worldY }: EmbedPlacementGhostProps) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: worldX - EMBED_WIDTH / 2,
        top: worldY - EMBED_HEIGHT / 2,
        width: EMBED_WIDTH,
        height: EMBED_HEIGHT,
        zIndex: CANVAS_Z.embedGhost,
      }}
    >
      <div className="size-full scale-[1.02] overflow-hidden rounded-[8px] border-2 border-dashed border-[#18a0fb]/70 bg-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.18)] ring-2 ring-[#18a0fb]/20">
        <EmbedEmptyState compact />
      </div>
    </div>
  );
}
