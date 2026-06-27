"use client";

import { forwardRef } from "react";
import { Redo2, StickyNote, Stamp, Type, Undo2 } from "lucide-react";

import { CanvasGlass } from "@/components/canvas/canvas-glass";
import {
  CanvasLinkEmbedTool,
  CanvasToolbarDivider,
} from "@/components/canvas/canvas-link-embed-tool";
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
  textToolRef?: React.RefObject<HTMLButtonElement | null>;
  stickyToolRef?: React.RefObject<HTMLButtonElement | null>;
  stampToolRef?: React.RefObject<HTMLButtonElement | null>;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onStartEmbedPlacement?: () => void;
  onCancelEmbedPlacement?: () => void;
  positionClassName?: string;
};

export function CanvasBottomToolbar({
  placementTool,
  onPlacementToolChange,
  stampPickerOpen,
  onStampPickerOpenChange,
  onStampSelect,
  themeMode,
  textToolRef,
  stickyToolRef,
  stampToolRef,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onStartEmbedPlacement,
  onCancelEmbedPlacement,
  positionClassName = "bottom-4",
}: CanvasBottomToolbarProps) {
  const isLight = themeMode === "light";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 z-30 flex justify-center px-3",
        positionClassName,
      )}
    >
      <div className="relative flex items-center gap-2 pointer-events-auto">
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
          themeMode={themeMode}
          variant="control"
          className="flex items-center gap-0.5 rounded-full p-1"
        >
          <ToolIcon
            ref={textToolRef}
            active={placementTool === "text"}
            label="Text"
            isLight={isLight}
            onClick={() =>
              onPlacementToolChange(placementTool === "text" ? "select" : "text")
            }
            highlight="bg-[#7c3aed] text-white"
          >
            <Type className="size-4" />
          </ToolIcon>

          <CanvasLinkEmbedTool
            variant="bottom-toolbar"
            active={placementTool === "embed"}
            isLight={isLight}
            onActivate={() => {
              if (placementTool === "embed") {
                onCancelEmbedPlacement?.();
              } else {
                onStartEmbedPlacement?.();
              }
            }}
          />

          <CanvasToolbarDivider isLight={isLight} />

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

        <CanvasGlass
          themeMode={themeMode}
          variant="control"
          className="flex items-center gap-0.5 rounded-full p-1"
        >
          <HistoryIcon
            label="Undo"
            shortcut="Ctrl+Z"
            isLight={isLight}
            disabled={!canUndo}
            onClick={() => onUndo?.()}
          >
            <Undo2 className="size-4" />
          </HistoryIcon>

          <HistoryIcon
            label="Redo"
            shortcut="Ctrl+Shift+Z"
            isLight={isLight}
            disabled={!canRedo}
            onClick={() => onRedo?.()}
          >
            <Redo2 className="size-4" />
          </HistoryIcon>
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

function HistoryIcon({
  label,
  shortcut,
  isLight,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut: string;
  isLight: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={`${label} (${shortcut})`}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors",
        disabled
          ? isLight
            ? "cursor-not-allowed text-[#1a1a1a]/25"
            : "cursor-not-allowed text-white/25"
          : isLight
            ? "text-[#1a1a1a]/80 hover:bg-black/[0.08] hover:text-[#1a1a1a]"
            : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
