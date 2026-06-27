"use client";

import { ClipboardPaste } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type CanvasBackgroundContextMenuProps = {
  x: number;
  y: number;
  canPaste: boolean;
  onPaste: () => void;
  onClose: () => void;
};

export function CanvasBackgroundContextMenu({
  x,
  y,
  canPaste,
  onPaste,
  onClose,
}: CanvasBackgroundContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[250] min-w-[9rem] overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <button
        type="button"
        disabled={!canPaste}
        onClick={(event) => {
          event.stopPropagation();
          if (!canPaste) return;
          onPaste();
          onClose();
        }}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors",
          canPaste
            ? "text-white/85 hover:bg-white/8 hover:text-white"
            : "cursor-not-allowed text-white/30",
        )}
      >
        <ClipboardPaste className="size-3.5 shrink-0" aria-hidden />
        Paste
      </button>
    </div>,
    document.body,
  );
}
