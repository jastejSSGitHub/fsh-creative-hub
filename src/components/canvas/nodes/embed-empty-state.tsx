"use client";

import { Link2, Plus } from "lucide-react";

type EmbedEmptyStateProps = {
  compact?: boolean;
};

export function EmbedEmptyState({ compact = false }: EmbedEmptyStateProps) {
  return (
    <div
      className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-hub-foreground/[0.02] to-hub-primary/[0.04]"
      aria-hidden
    >
      <div className="canvas-embed-float absolute left-[12%] top-[18%] font-mono text-[0.65rem] font-semibold text-hub-primary/35">
        {"<html>"}
      </div>
      <div
        className="canvas-embed-float absolute right-[14%] top-[24%] font-mono text-[0.6rem] font-semibold text-hub-foreground/25"
        style={{ animationDelay: "0.6s" }}
      >
        {"</div>"}
      </div>
      <div
        className="canvas-embed-float absolute bottom-[22%] left-[18%] font-mono text-[0.55rem] font-semibold text-hub-primary/25"
        style={{ animationDelay: "1.1s" }}
      >
        {"{ link }"}
      </div>
      <div
        className="canvas-embed-float absolute bottom-[28%] right-[16%] font-mono text-[0.6rem] font-semibold text-hub-foreground/20"
        style={{ animationDelay: "0.3s" }}
      >
        {"<a />"}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
        <div className="relative flex size-12 items-center justify-center rounded-full border-2 border-dashed border-hub-primary/35 bg-white/80 shadow-sm">
          <Plus className="size-5 text-hub-primary" strokeWidth={2.5} />
          <Link2
            className="absolute -right-1 -top-1 size-4 rounded-full bg-hub-primary p-0.5 text-white"
            strokeWidth={2.5}
          />
        </div>
        {!compact && (
          <>
            <p className="text-[0.8125rem] font-medium text-hub-foreground/75">
              Paste a link here
            </p>
            <p className="max-w-[14rem] text-[0.6875rem] leading-relaxed text-hub-foreground/45">
              Drop or paste any URL — pages render inside this frame
            </p>
          </>
        )}
      </div>
    </div>
  );
}
