"use client";

import { STAMP_DEFS } from "@/lib/canvas/presets";
import type { StampId } from "@/lib/canvas/types";

type StampPickerRadialProps = {
  onSelect: (stampId: StampId) => void;
  onClose: () => void;
};

const STAMP_IDS = Object.keys(STAMP_DEFS) as StampId[];

export function StampPickerRadial({ onSelect, onClose }: StampPickerRadialProps) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20"
        aria-label="Close sticker picker"
        onClick={onClose}
      />

      <div className="absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2">
        <div className="relative size-52 rounded-full border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl">
          {STAMP_IDS.map((id, index) => {
            const def = STAMP_DEFS[id];
            const angle = (index / STAMP_IDS.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 72;
            const x = 50 + Math.cos(angle) * (radius / 2.08);
            const y = 50 + Math.sin(angle) * (radius / 2.08);

            return (
              <button
                key={id}
                type="button"
                title={def.label}
                onClick={() => {
                  onSelect(id);
                  onClose();
                }}
                className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white text-xl shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-transform hover:scale-110"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: def.ring,
                }}
              >
                {def.emoji}
              </button>
            );
          })}

          <div className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 text-lg">
            ✨
          </div>
        </div>
      </div>
    </>
  );
}
