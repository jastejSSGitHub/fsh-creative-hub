"use client";

import { ImageDown } from "lucide-react";

import type { CanvasTheme } from "@/lib/canvas/presets";
import { cn } from "@/lib/utils";

type CanvasFileDropOverlayProps = {
  active: boolean;
  theme: CanvasTheme;
};

/** Screen-space tint and drop hint while dragging files over the canvas. */
export function CanvasFileDropOverlay({
  active,
  theme,
}: CanvasFileDropOverlayProps) {
  if (!active) return null;

  const isLight = theme.mode === "light";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-[15] flex items-center justify-center transition-colors duration-200",
        isLight ? "bg-[#18a0fb]/[0.08]" : "bg-[#18a0fb]/[0.12]",
      )}
      aria-hidden
    >
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border px-8 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-md",
          isLight
            ? "border-[#18a0fb]/35 bg-white/88 text-[#1a1a1a]"
            : "border-white/20 bg-[rgba(24,24,24,0.82)] text-white",
        )}
      >
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full border-2 border-dashed",
            isLight
              ? "border-[#18a0fb]/50 bg-[#18a0fb]/10 text-[#18a0fb]"
              : "border-[#18a0fb]/60 bg-[#18a0fb]/15 text-[#18a0fb]",
          )}
        >
          <ImageDown className="size-7" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="text-center">
          <p className="font-display text-[1rem] font-semibold tracking-tight">
            Drop image here
          </p>
          <p
            className={cn(
              "mt-1 text-[0.8125rem]",
              isLight ? "text-[#1a1a1a]/55" : "text-white/55",
            )}
          >
            JPG, PNG, WebP, or GIF
          </p>
        </div>
      </div>
    </div>
  );
}
