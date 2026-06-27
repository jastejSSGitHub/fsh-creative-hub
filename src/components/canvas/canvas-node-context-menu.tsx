"use client";

import { Copy, CopyPlus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { CanvasToolbarDivider } from "@/components/canvas/canvas-link-embed-tool";
import { cn } from "@/lib/utils";

type CanvasNodeContextMenuProps = {
  x: number;
  y: number;
  onCopy: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function CanvasNodeContextMenu({
  x,
  y,
  onCopy,
  onDuplicate,
  onDelete,
  onClose,
}: CanvasNodeContextMenuProps) {
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
      data-text-toolbar-popover
      className="fixed z-[250] flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-1.5 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <ContextMenuButton label="Copy" tooltip="Copy" onClick={onCopy}>
        <Copy className="size-3.5" />
      </ContextMenuButton>

      <ContextMenuButton label="Duplicate" tooltip="Duplicate" onClick={onDuplicate}>
        <CopyPlus className="size-3.5" />
      </ContextMenuButton>

      <CanvasToolbarDivider />

      <ContextMenuButton
        label="Delete"
        tooltip="Delete"
        onClick={onDelete}
        className="text-white/60 hover:bg-[#ef4444]/20 hover:text-[#fca5a5]"
      >
        <Trash2 className="size-3.5" />
      </ContextMenuButton>
    </div>,
    document.body,
  );
}

function ContextMenuButton({
  label,
  tooltip,
  onClick,
  className,
  children,
}: {
  label: string;
  tooltip: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({ top: rect.top - 10, left: rect.left + rect.width / 2 });
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseEnter={() => {
          updatePosition();
          setTipVisible(true);
        }}
        onMouseLeave={() => setTipVisible(false)}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white",
          className,
        )}
      >
        {children}
      </button>
      {tipVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-none fixed z-[260] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[6px] border border-white/10 bg-[#1a1a1a] px-2.5 py-1 text-[0.6875rem] font-medium text-white shadow-lg"
          >
            {tooltip}
          </span>,
          document.body,
        )}
    </>
  );
}
