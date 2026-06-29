"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type CommentOptionsMenuProps = {
  onDelete: () => void;
  onCreateTask?: () => void;
  className?: string;
};

export function CommentOptionsMenu({
  onDelete,
  onCreateTask,
  className,
}: CommentOptionsMenuProps) {
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

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        aria-label="Comment options"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex size-7 items-center justify-center rounded-md text-hub-foreground/45 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground/70"
      >
        <MoreHorizontal className="size-4" strokeWidth={2} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[7.5rem] overflow-hidden rounded-md border border-hub-foreground/10 bg-hub-surface py-1 shadow-lg"
        >
          {onCreateTask && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onCreateTask();
              }}
              className="flex w-full px-3 py-2 text-left text-sm text-hub-foreground transition-colors hover:bg-hub-foreground/5"
            >
              Create task
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
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
