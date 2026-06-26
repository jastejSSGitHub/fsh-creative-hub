"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type ProjectContextMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
};

type ProjectContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  items: ProjectContextMenuItem[];
  onClose: () => void;
};

export function ProjectContextMenu({
  open,
  x,
  y,
  items,
  onClose,
}: ProjectContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function handleScroll() {
      onClose();
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const padding = 8;
    let nextX = x;
    let nextY = y;

    if (nextX + rect.width > window.innerWidth - padding) {
      nextX = window.innerWidth - rect.width - padding;
    }
    if (nextY + rect.height > window.innerHeight - padding) {
      nextY = window.innerHeight - rect.height - padding;
    }

    menu.style.left = `${Math.max(padding, nextX)}px`;
    menu.style.top = `${Math.max(padding, nextY)}px`;
  }, [open, x, y, items]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[12rem] overflow-hidden rounded-lg border border-hub-espresso/10 bg-white py-1 shadow-xl"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item) => (
        <div key={item.id}>
          {item.separatorBefore && (
            <div className="my-1 border-t border-hub-espresso/10" role="separator" />
          )}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onSelect();
              onClose();
            }}
            className={cn(
              "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
              item.destructive
                ? "text-hub-rejected hover:bg-hub-rejected/10"
                : "text-hub-espresso hover:bg-hub-espresso/5",
              item.disabled && "cursor-not-allowed opacity-45",
            )}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
