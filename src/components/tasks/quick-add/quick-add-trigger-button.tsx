"use client";

import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type QuickAddTriggerButtonProps = {
  onClick: () => void;
  className?: string;
  size?: "default" | "header";
};

export function QuickAddTriggerButton({
  onClick,
  className,
  size = "default",
}: QuickAddTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-[6px] bg-hub-primary font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-colors hover:bg-hub-primary/90",
        size === "header"
          ? "min-h-11 px-3 text-[0.8125rem] font-medium shadow-sm hover:bg-[#1590e8] lg:min-h-9"
          : "px-4 py-2 text-[0.8125rem]",
        className,
      )}
    >
      <Plus className="size-3.5 shrink-0" aria-hidden />
      Add task
      <kbd className="rounded-[4px] bg-white/15 px-1.5 py-0.5 font-mono text-[0.625rem] font-normal text-white/85">
        Q
      </kbd>
    </button>
  );
}
