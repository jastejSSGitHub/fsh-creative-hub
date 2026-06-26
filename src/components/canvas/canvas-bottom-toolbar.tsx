"use client";

import { forwardRef } from "react";
import { StickyNote, Stamp } from "lucide-react";

import { CanvasGlass } from "@/components/canvas/canvas-glass";
import { StampPickerRadial } from "@/components/canvas/stamp-picker-radial";
import type { CanvasPlacementTool } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

type CanvasBottomToolbarProps = {
  placementTool: CanvasPlacementTool;
  onPlacementToolChange: (tool: CanvasPlacementTool) => void;
  stampPickerOpen: boolean;
  onStampPickerOpenChange: (open: boolean) => void;
  onStampSelect: (stampId: import("@/lib/canvas/types").StampId) => void;
  themeMode: "dark" | "light";
  stickyToolRef?: React.RefObject<HTMLButtonElement | null>;
  stampToolRef?: React.RefObject<HTMLButtonElement | null>;
};

export function CanvasBottomToolbar({
  placementTool,
  onPlacementToolChange,
  stampPickerOpen,
  onStampPickerOpenChange,
  onStampSelect,
  themeMode,
  stickyToolRef,
  stampToolRef,
}: CanvasBottomToolbarProps) {
  const isLight = themeMode === "light";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-3">
      <div className="relative pointer-events-auto">
        {stampPickerOpen && (
          <StampPickerRadial
            onSelect={(stampId) => {
              onStampSelect(stampId);
              onPlacementToolChange("stamp");
              onStampPickerOpenChange(false);
            }}
            onClose={() => onStampPickerOpenChange(false)}
          />
        )}

        <CanvasGlass
          className={cn(
            "flex items-center gap-0.5 rounded-full p-1",
            isLight && "border-black/12 bg-white/92 shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
          )}
        >
          <ToolIcon
            ref={stickyToolRef}
            active={placementTool === "sticky"}
            label="Sticky note"
            isLight={isLight}
            onClick={() =>
              onPlacementToolChange(placementTool === "sticky" ? "select" : "sticky")
            }
            highlight="bg-[#fff9b1] text-[#1a1a1a]"
          >
            <StickyNote className="size-4" />
          </ToolIcon>

          <ToolIcon
            ref={stampToolRef}
            active={placementTool === "stamp" || stampPickerOpen}
            label="Stickers"
            isLight={isLight}
            onClick={() => onStampPickerOpenChange(!stampPickerOpen)}
            highlight="bg-[#7c3aed] text-white"
          >
            <Stamp className="size-4" />
          </ToolIcon>
        </CanvasGlass>
      </div>
    </div>
  );
}

const ToolIcon = forwardRef<
  HTMLButtonElement,
  {
    active: boolean;
    label: string;
    isLight: boolean;
    onClick: () => void;
    highlight: string;
    children: React.ReactNode;
  }
>(function ToolIcon(
  { active, label, isLight, onClick, highlight, children },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors",
        active ? highlight : isLight
          ? "text-[#1a1a1a]/80 hover:bg-black/[0.08] hover:text-[#1a1a1a]"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
});
