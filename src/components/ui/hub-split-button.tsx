"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HubSplitButtonProps = {
  label: string;
  onPrimaryClick?: () => void;
  onMenuClick?: () => void;
  menuOpen?: boolean;
  disabled?: boolean;
  className?: string;
  menuContent?: ReactNode;
};

export function HubSplitButton({
  label,
  onPrimaryClick,
  onMenuClick,
  menuOpen = false,
  disabled = false,
  className,
  menuContent,
}: HubSplitButtonProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={onPrimaryClick}
        className="inline-flex min-h-8 items-center rounded-l-[6px] bg-hub-primary px-3 text-[0.8125rem] font-medium text-white transition-colors hover:bg-[#1590e8] disabled:opacity-60"
      >
        {label}
      </button>
      <span className="w-px self-stretch bg-white/25" aria-hidden />
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={onMenuClick}
        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-r-[6px] bg-hub-primary text-white transition-colors hover:bg-[#1590e8] disabled:opacity-60"
      >
        <ChevronDown className="size-3.5" aria-hidden />
      </button>
      {menuOpen && menuContent ? (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[10rem] overflow-hidden rounded-[6px] border border-hub-foreground/12 bg-hub-surface py-1 shadow-xl">
          {menuContent}
        </div>
      ) : null}
    </div>
  );
}
