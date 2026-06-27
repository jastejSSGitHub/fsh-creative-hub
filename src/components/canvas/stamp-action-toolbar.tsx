"use client";

import { Copy, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { CanvasLinkEmbedTool, CanvasToolbarDivider } from "@/components/canvas/canvas-link-embed-tool";
import { cn } from "@/lib/utils";

type StampActionToolbarProps = {
  onDuplicate: () => void;
  onDelete: () => void;
};

export function StampActionToolbar({
  onDuplicate,
  onDelete,
}: StampActionToolbarProps) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-1.5 py-1 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-150"
      data-stamp-toolbar
    >
      <ToolbarButton label="Duplicate sticker" onClick={onDuplicate}>
        <Copy className="size-3.5" />
      </ToolbarButton>

      <CanvasToolbarDivider />

      <ToolbarButton
        label="Delete sticker"
        onClick={onDelete}
        className="text-white/60 hover:bg-[#ef4444]/20 hover:text-[#fca5a5]"
      >
        <Trash2 className="size-3.5" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}
