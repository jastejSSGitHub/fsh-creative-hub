"use client";

import { ChevronDown, ClipboardList, PenTool, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type CreateFileOption = {
  id: string;
  label: string;
  description: string;
  icon: typeof ClipboardList;
  available: boolean;
  onSelect?: () => void;
};

type ProjectCreateMenuProps = {
  canCreate: boolean;
  onCreateReviewBoard: () => void;
};

export function ProjectCreateMenu({
  canCreate,
  onCreateReviewBoard,
}: ProjectCreateMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const options: CreateFileOption[] = [
    {
      id: "review_board",
      label: "Review board",
      description: "Upload and approve creative assets",
      icon: ClipboardList,
      available: true,
      onSelect: onCreateReviewBoard,
    },
    {
      id: "canvas",
      label: "Open canvas",
      description: "Brainstorm and sketch ideas",
      icon: PenTool,
      available: false,
    },
  ];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!canCreate) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex min-h-9 items-center gap-1 rounded-[6px] bg-hub-primary px-3 text-[0.8125rem] font-medium text-white shadow-sm transition-colors hover:bg-[#1590e8]",
          open && "ring-2 ring-hub-primary/35",
        )}
      >
        <Plus className="size-4" aria-hidden />
        Create
        <ChevronDown className="size-3.5 opacity-80" aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-[15.5rem] overflow-hidden rounded-[6px] border border-hub-espresso/12 bg-white py-1 shadow-xl"
        >
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                disabled={!option.available}
                onClick={() => {
                  if (!option.available) return;
                  setOpen(false);
                  option.onSelect?.();
                }}
                className={cn(
                  "flex w-full items-start gap-2.5 px-2.5 py-2 text-left transition-colors",
                  option.available
                    ? "hover:bg-hub-espresso/[0.04]"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[4px] bg-hub-primary/10 text-hub-primary">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.8125rem] font-medium text-hub-espresso">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-snug text-hub-espresso/50">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
