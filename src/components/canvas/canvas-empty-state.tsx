"use client";

import { ImageIcon, MousePointer2, Shapes, StickyNote, X } from "lucide-react";

import { CanvasGlass } from "@/components/canvas/canvas-glass";

type CanvasEmptyStateProps = {
  onDismiss: () => void;
};

export function CanvasEmptyState({ onDismiss }: CanvasEmptyStateProps) {
  return (
    <div className="flex w-[min(92vw,28rem)] flex-col items-center text-center">
      <CanvasIllustration />

      <CanvasGlass className="relative mt-8 rounded-2xl px-6 py-5">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss and start with an empty canvas"
          className="absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" aria-hidden />
        </button>

        <p className="font-display text-lg font-extrabold tracking-tight text-white">
          Your canvas is ready
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Drop images, add stickies, and frame ideas — this is your freeform space
          to explore concepts before they become deliverables.
        </p>

        <ul className="mt-5 space-y-2.5 text-left text-sm text-white/70">
          <li className="flex items-center gap-2.5">
            <StickyNote className="size-4 shrink-0 text-amber-300/80" aria-hidden />
            Sketch with stickies and notes
          </li>
          <li className="flex items-center gap-2.5">
            <ImageIcon className="size-4 shrink-0 text-sky-300/80" aria-hidden />
            Drop reference images anywhere
          </li>
          <li className="flex items-center gap-2.5">
            <Shapes className="size-4 shrink-0 text-violet-300/80" aria-hidden />
            Frame sections to organize ideas
          </li>
        </ul>

        <p className="mt-5 flex items-center justify-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-white/35">
          <MousePointer2 className="size-3" aria-hidden />
          Scroll to pan · Ctrl+scroll to zoom
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2 text-[0.8125rem] font-medium text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white"
        >
          Start with empty canvas
        </button>
      </CanvasGlass>
    </div>
  );
}

function CanvasIllustration() {
  return (
    <div className="relative h-36 w-56" aria-hidden>
      <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/15 blur-xl" />

      <div className="absolute left-[8%] top-[18%] h-14 w-16 rotate-[-6deg] rounded-lg border border-white/15 bg-amber-200/90 shadow-lg">
        <div className="h-2 rounded-t-[7px] bg-amber-300/60" />
        <div className="mt-2 space-y-1 px-2">
          <div className="h-1 w-full rounded-full bg-amber-900/15" />
          <div className="h-1 w-2/3 rounded-full bg-amber-900/10" />
        </div>
      </div>

      <div className="absolute right-[6%] top-[8%] h-16 w-20 rotate-[4deg] rounded-xl border border-white/20 bg-white/[0.08] shadow-lg backdrop-blur-sm">
        <div className="m-2 aspect-[4/3] rounded-md bg-gradient-to-br from-violet-400/30 to-sky-400/20" />
      </div>

      <div className="absolute bottom-[6%] left-[22%] h-[4.5rem] w-24 rotate-[1deg] rounded-xl border border-dashed border-white/25 bg-white/[0.04]">
        <div className="flex h-full items-center justify-center font-mono text-[0.55rem] uppercase tracking-wider text-white/30">
          Frame
        </div>
      </div>

      <div className="absolute bottom-[22%] right-[18%] flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-md">
        <MousePointer2 className="size-4 text-white/70" />
      </div>
    </div>
  );
}
