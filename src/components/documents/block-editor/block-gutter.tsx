"use client";

import {
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";

import { HubTooltip } from "@/components/ui/hub-tooltip";
import { cn } from "@/lib/utils";

type BlockGutterProps = {
  visible: boolean;
  canDelete?: boolean;
  onAddBelow: () => void;
  onDelete?: () => void;
  showDrag?: boolean;
  dragHandleProps?: {
    draggable: boolean;
    onDragStart: (event: React.DragEvent) => void;
    onDragEnd: () => void;
  };
};

export function BlockGutter({
  visible,
  canDelete = true,
  onAddBelow,
  onDelete,
  showDrag = true,
  dragHandleProps,
}: BlockGutterProps) {
  return (
    <div
      className={cn(
        "absolute left-0 top-0 flex h-full w-24 items-start justify-end gap-0.5 pr-2 pt-0.5 transition-opacity",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="relative">
        <HubTooltip label="Add block" side="top">
          <button
            type="button"
            onClick={onAddBelow}
            className="inline-flex size-6 items-center justify-center rounded-[4px] text-hub-foreground/40 hover:bg-hub-foreground/[0.06] hover:text-hub-foreground"
            aria-label="Add block"
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        </HubTooltip>
      </div>

      {showDrag && dragHandleProps ? (
        <button
          type="button"
          {...dragHandleProps}
          className="inline-flex size-6 cursor-grab items-center justify-center rounded-[4px] text-hub-foreground/35 hover:bg-hub-foreground/[0.06] hover:text-hub-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-3.5" aria-hidden />
        </button>
      ) : null}

      {onDelete ? (
        <HubTooltip label="Delete block" side="top">
          <button
            type="button"
            disabled={!canDelete}
            onClick={onDelete}
            aria-label="Delete block"
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-[4px] text-hub-foreground/35 transition-colors",
              canDelete
                ? "hover:bg-hub-rejected/10 hover:text-hub-rejected"
                : "cursor-not-allowed opacity-30",
            )}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </HubTooltip>
      ) : null}
    </div>
  );
}
