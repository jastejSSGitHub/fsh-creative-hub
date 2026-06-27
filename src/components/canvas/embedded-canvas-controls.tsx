"use client";

import { Hand, Minus, MousePointer2, Plus, RotateCcw } from "lucide-react";

import { CanvasGlass } from "@/components/canvas/canvas-glass";
import {
  canvasGlassControlClass,
  canvasGlassDividerClass,
  canvasGlassTextClass,
} from "@/lib/canvas/glass-styles";
import { formatZoomPercent, type CanvasTool } from "@/lib/canvas/viewport";
import type { CanvasTheme } from "@/lib/canvas/presets";
import { cn } from "@/lib/utils";

type EmbeddedCanvasControlsProps = {
  theme: CanvasTheme;
  tool: CanvasTool;
  zoom: number;
  onToolChange: (tool: CanvasTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
};

export function EmbeddedCanvasControls({
  theme,
  tool,
  zoom,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onResetView,
}: EmbeddedCanvasControlsProps) {
  return (
    <div
      data-canvas-ui
      className="pointer-events-none absolute right-3 top-3 z-40 flex items-center gap-2 sm:right-4 sm:top-4"
    >
      <CanvasGlass themeMode={theme.mode} className="pointer-events-auto flex items-center gap-0.5 p-1">
        <button
          type="button"
          aria-label="Select"
          aria-pressed={tool === "select"}
          onClick={() => onToolChange("select")}
          className={cn(
            canvasGlassControlClass(theme.mode),
            tool === "select" && "bg-white/15",
          )}
        >
          <MousePointer2 className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Pan"
          aria-pressed={tool === "hand"}
          onClick={() => onToolChange("hand")}
          className={cn(
            canvasGlassControlClass(theme.mode),
            tool === "hand" && "bg-white/15",
          )}
        >
          <Hand className="size-3.5" />
        </button>
        <span className={canvasGlassDividerClass(theme.mode)} aria-hidden />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={onZoomOut}
          className={canvasGlassControlClass(theme.mode)}
        >
          <Minus className="size-3.5" />
        </button>
        <span className={cn(canvasGlassTextClass(theme.mode), "min-w-[2.75rem] text-center text-[0.6875rem]")}>
          {formatZoomPercent(zoom)}
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={onZoomIn}
          className={canvasGlassControlClass(theme.mode)}
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Reset view"
          onClick={onResetView}
          className={canvasGlassControlClass(theme.mode)}
        >
          <RotateCcw className="size-3.5" />
        </button>
      </CanvasGlass>
    </div>
  );
}
