"use client";

import { cn } from "@/lib/utils";
import type { QuickAddChip } from "@/lib/tasks/types";

const CHIP_STYLES: Record<QuickAddChip["type"], string> = {
  name: "bg-hub-foreground/8 text-hub-foreground",
  date: "bg-hub-primary/12 text-hub-primary",
  project: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300",
  label: "bg-purple-500/12 text-purple-600 dark:text-purple-300",
  priority: "bg-hub-rejected/12 text-hub-rejected",
  assignee: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  recurring: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
};

type QuickAddChipsProps = {
  chips: QuickAddChip[];
};

export function QuickAddChips({ chips }: QuickAddChipsProps) {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-2">
      {chips.map((chip, index) => (
        <span
          key={`${chip.type}-${index}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[0.6875rem] font-medium",
            CHIP_STYLES[chip.type],
          )}
        >
          <span className="opacity-60">{chip.label}</span>
          {chip.value}
        </span>
      ))}
    </div>
  );
}
