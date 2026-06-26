"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type FileSortField = "alphabetical" | "date_created" | "last_modified";
export type FileSortOrder = "oldest" | "newest";

type ProjectFileSortMenuProps = {
  sortField: FileSortField;
  sortOrder: FileSortOrder;
  onSortFieldChange: (field: FileSortField) => void;
  onSortOrderChange: (order: FileSortOrder) => void;
  menuAlign?: "left" | "right";
};

const SORT_FIELDS: { value: FileSortField; label: string }[] = [
  { value: "alphabetical", label: "Alphabetical" },
  { value: "date_created", label: "Date created" },
  { value: "last_modified", label: "Last modified" },
];

const SORT_ORDERS: { value: FileSortOrder; label: string }[] = [
  { value: "oldest", label: "Oldest first" },
  { value: "newest", label: "Newest first" },
];

function sortFieldLabel(field: FileSortField): string {
  return SORT_FIELDS.find((option) => option.value === field)?.label ?? "Last modified";
}

export function ProjectFileSortMenu({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderChange,
  menuAlign = "left",
}: ProjectFileSortMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "relative inline-flex min-h-8 items-center rounded-[6px] border border-hub-foreground/12 bg-hub-surface py-0 pr-7 pl-2.5 text-[0.8125rem] text-hub-foreground transition-colors hover:bg-hub-foreground/[0.03]",
          open && "border-hub-primary/50 ring-1 ring-hub-primary/35",
        )}
      >
        {sortFieldLabel(sortField)}
        <ChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-hub-foreground/40 transition-transform duration-150",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[11.5rem] overflow-hidden rounded-[6px] border border-hub-foreground/12 bg-hub-surface py-1 shadow-xl",
            menuAlign === "right" ? "right-0" : "left-0",
          )}
        >
          <p className="px-2.5 py-1.5 text-[0.6875rem] font-medium text-hub-foreground/45">
            Sort by
          </p>
          {SORT_FIELDS.map((option) => {
            const selected = option.value === sortField;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onSortFieldChange(option.value);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[0.8125rem] text-hub-foreground transition-colors",
                  selected
                    ? "bg-hub-primary/10 font-medium"
                    : "hover:bg-hub-foreground/[0.04]",
                )}
              >
                {option.label}
                {selected && (
                  <Check className="size-3.5 shrink-0 text-hub-primary" aria-hidden />
                )}
              </button>
            );
          })}

          <div className="my-1 border-t border-hub-foreground/10" role="separator" />

          <p className="px-2.5 py-1.5 text-[0.6875rem] font-medium text-hub-foreground/45">
            Order
          </p>
          {SORT_ORDERS.map((option) => {
            const selected = option.value === sortOrder;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onSortOrderChange(option.value);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[0.8125rem] text-hub-foreground transition-colors",
                  selected
                    ? "bg-hub-primary/10 font-medium"
                    : "hover:bg-hub-foreground/[0.04]",
                )}
              >
                {option.label}
                {selected && (
                  <Check className="size-3.5 shrink-0 text-hub-primary" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
