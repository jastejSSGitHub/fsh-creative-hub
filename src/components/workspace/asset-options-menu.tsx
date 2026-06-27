"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { HubTooltip } from "@/components/ui/hub-tooltip";
import { cn } from "@/lib/utils";

const DELETE_BLOCKED_MESSAGE = "You can only delete assets you uploaded.";

type AssetOptionsMenuProps = {
  canDelete: boolean;
  onView: () => void;
  onDelete: () => void;
  className?: string;
};

export function AssetOptionsMenu({
  canDelete,
  onView,
  onDelete,
  className,
}: AssetOptionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const deleteItem = (
    <button
      type="button"
      role="menuitem"
      disabled={!canDelete}
      aria-disabled={!canDelete}
      onClick={(event) => {
        event.stopPropagation();
        if (!canDelete) return;
        setOpen(false);
        onDelete();
      }}
      className={cn(
        "flex w-full px-3 py-2 text-left text-sm transition-colors",
        canDelete
          ? "text-hub-rejected hover:bg-hub-rejected/10"
          : "cursor-not-allowed text-hub-foreground/30",
      )}
    >
      Delete
    </button>
  );

  return (
    <div
      ref={rootRef}
      className={cn("relative shrink-0", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Asset options"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={cn(
          "flex size-7 items-center justify-center rounded-md text-white shadow-sm backdrop-blur-sm transition-opacity",
          "bg-black/45 hover:bg-black/60",
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        <MoreHorizontal className="size-4" strokeWidth={2} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[7.5rem] overflow-hidden rounded-md border border-hub-foreground/10 bg-hub-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onView();
            }}
            className="flex w-full px-3 py-2 text-left text-sm text-hub-foreground transition-colors hover:bg-hub-foreground/5"
          >
            View
          </button>
          {canDelete ? (
            deleteItem
          ) : (
            <HubTooltip label={DELETE_BLOCKED_MESSAGE} side="top" className="block w-full">
              {deleteItem}
            </HubTooltip>
          )}
        </div>
      )}
    </div>
  );
}
