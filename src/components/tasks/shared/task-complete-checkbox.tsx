"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type TaskCompleteCheckboxProps = {
  completed: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function TaskCompleteCheckbox({
  completed,
  onToggle,
  disabled,
  size = "md",
}: TaskCompleteCheckboxProps) {
  const dim = size === "sm" ? "size-5" : "size-[1.375rem]";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      aria-label={completed ? "Mark incomplete" : "Complete task"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border transition-colors",
        dim,
        completed
          ? "border-hub-final bg-hub-final text-white"
          : "border-hub-foreground/25 bg-hub-surface hover:border-hub-primary/50",
        disabled && "opacity-50",
      )}
    >
      {completed && <Check className="size-3" strokeWidth={3} aria-hidden />}
    </button>
  );
}
