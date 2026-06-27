"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ProjectFileOptionsMenuProps = {
  canDelete: boolean;
  onDelete: () => void;
  className?: string;
};

export function ProjectFileOptionsMenu({
  canDelete,
  onDelete,
  className,
}: ProjectFileOptionsMenuProps) {
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

  if (!canDelete) return null;

  return (
    <div
      ref={rootRef}
      className={cn("relative shrink-0", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="File options"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={cn(
          "flex size-8 items-center justify-center rounded-md border shadow-[0_2px_12px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[opacity,border-color,transform,box-shadow,background-color] duration-300 ease-out",
          "border-white/35 bg-hub-surface/20 text-white hover:border-white/50 hover:bg-hub-surface/30 active:scale-90",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100",
        )}
      >
        <MoreHorizontal className="size-4" strokeWidth={2} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[7.5rem] overflow-hidden rounded-md border border-hub-foreground/10 bg-hub-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex w-full px-3 py-2 text-left text-sm text-hub-rejected transition-colors hover:bg-hub-rejected/10"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
