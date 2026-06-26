"use client";

import { useEffect, useRef, useState } from "react";

import { PAGE_EMOJI_CATEGORIES } from "@/lib/documents/emojis";
import { cn } from "@/lib/utils";

type DocumentIconPickerProps = {
  icon: string | null;
  onChange: (icon: string | null) => void;
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
};

export function DocumentIconPicker({
  icon,
  onChange,
  open,
  onClose,
  anchorRef,
}: DocumentIconPickerProps) {
  const [filter, setFilter] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        panelRef.current?.contains(event.target as Node) ||
        anchorRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const q = filter.trim().toLowerCase();
  const categories = q
    ? PAGE_EMOJI_CATEGORIES.map((c) => ({
        ...c,
        emojis: c.emojis.filter(() => true),
      })).filter((c) => c.label.toLowerCase().includes(q) || c.emojis.length)
    : PAGE_EMOJI_CATEGORIES;

  return (
    <div
      ref={panelRef}
      style={{ top: coords.top, left: coords.left }}
      className="fixed z-[100] w-[20rem] overflow-hidden rounded-[8px] border border-hub-foreground/12 bg-hub-espresso shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          className="min-h-8 flex-1 rounded-[4px] bg-white/8 px-2.5 text-[0.8125rem] text-hub-paper outline-none placeholder:text-hub-paper/35"
          autoFocus
        />
        {icon ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              onClose();
            }}
            className="text-[0.75rem] text-hub-paper/55 hover:text-hub-paper"
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className="max-h-[14rem] overflow-y-auto p-2">
        {categories.map((category) => (
          <div key={category.id} className="mb-2">
            <p className="px-1 py-1 text-[0.625rem] font-medium uppercase tracking-wider text-hub-paper/40">
              {category.label}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {category.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji);
                    onClose();
                  }}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-[4px] text-lg hover:bg-white/10",
                    icon === emoji && "bg-white/15",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentIconButton({
  icon,
  onClick,
  size = "lg",
  className,
}: {
  icon: string | null;
  onClick?: () => void;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (!icon) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center transition-transform hover:scale-105",
        size === "lg" ? "text-[3.5rem] leading-none" : "text-base",
        className,
      )}
    >
      {icon}
    </button>
  );
}
