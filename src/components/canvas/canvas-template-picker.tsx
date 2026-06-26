"use client";

import { X } from "lucide-react";

import {
  BrainstormTemplateIllustration,
  EmptyCanvasTemplateIllustration,
} from "@/components/canvas/canvas-template-illustrations";
import { CanvasGlass } from "@/components/canvas/canvas-glass";
import { cn } from "@/lib/utils";

type CanvasTemplatePickerProps = {
  open: boolean;
  themeMode: "dark" | "light";
  onApplyHowMightWe: () => void;
  onStartEmpty: () => void;
  onClose: () => void;
};

const ILLUSTRATION_FRAMES = {
  brainstorm: "bg-gradient-to-br from-[#FFC94B] via-[#F4A261] to-[#FF6B6B]",
  empty: "bg-gradient-to-br from-[#3A86FF] via-[#5B8DEF] to-[#8338EC]",
} as const;

export function CanvasTemplatePicker({
  open,
  themeMode,
  onApplyHowMightWe,
  onStartEmpty,
  onClose,
}: CanvasTemplatePickerProps) {
  if (!open) return null;

  const isLight = themeMode === "light";

  const titleClass = isLight ? "text-[#1a1a1a]" : "text-white";
  const mutedClass = isLight ? "text-[#1a1a1a]/55" : "text-white/55";
  const cardTitleClass = isLight ? "text-[#1a1a1a]" : "text-white";
  const cardMutedClass = isLight ? "text-[#1a1a1a]/55" : "text-white/55";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-4">
      <CanvasGlass
        className={cn(
          "pointer-events-auto w-full max-w-3xl rounded-2xl p-5",
          isLight && "border-black/10 bg-white/95 text-[#1a1a1a]",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={cn("font-display text-lg font-extrabold", titleClass)}>
              Open canvas is good for many things
            </h2>
            <p className={cn("mt-1 text-sm", mutedClass)}>
              Pick one to get started, or begin with a blank canvas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md transition-colors",
              isLight ? "text-[#1a1a1a]/45 hover:bg-black/5" : "text-white/45 hover:bg-white/10",
            )}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onApplyHowMightWe}
            className={cn(
              "rounded-xl border-2 border-[#18a0fb] p-4 text-left transition-colors",
              isLight
                ? "bg-[#dbeafe]/40 hover:bg-[#dbeafe]/70"
                : "bg-[#18a0fb]/10 hover:bg-[#18a0fb]/20",
            )}
          >
            <div
              className={cn(
                "relative mb-3 h-20 overflow-hidden rounded-lg p-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
                ILLUSTRATION_FRAMES.brainstorm,
              )}
            >
              <BrainstormTemplateIllustration />
            </div>
            <p className={cn("font-medium", cardTitleClass)}>Dreaming up new ideas</p>
            <p className={cn("mt-1 text-xs", cardMutedClass)}>
              How might we… brainstorm template
            </p>
          </button>

          <button
            type="button"
            onClick={onStartEmpty}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              isLight
                ? "border-black/10 hover:bg-black/[0.03]"
                : "border-white/15 hover:bg-white/[0.05]",
            )}
          >
            <div
              className={cn(
                "relative mb-3 h-20 overflow-hidden rounded-lg p-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
                ILLUSTRATION_FRAMES.empty,
              )}
            >
              <EmptyCanvasTemplateIllustration />
            </div>
            <p className={cn("font-medium", cardTitleClass)}>Start empty</p>
            <p className={cn("mt-1 text-xs", cardMutedClass)}>
              Freeform canvas — add stickies anywhere
            </p>
          </button>
        </div>
      </CanvasGlass>
    </div>
  );
}
