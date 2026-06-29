"use client";

import { Calendar } from "lucide-react";
import { useRef } from "react";

import {
  formatTaskDueDate,
  toDatetimeLocalValue,
} from "@/lib/tasks/format-due-date";
import { hubDialogFieldClassName } from "@/lib/ui/hub-dialog-form";
import { cn } from "@/lib/utils";

type TaskDueDateFieldProps = {
  value: string | null;
  onChange: (iso: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function TaskDueDateField({
  value,
  onChange,
  disabled,
  className,
}: TaskDueDateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    if (disabled) return;
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className={cn(
          hubDialogFieldClassName,
          "flex w-full items-center justify-between gap-2 text-left",
        )}
      >
        <span className={cn(!value && "text-hub-foreground/40")}>
          {value ? formatTaskDueDate(value) : "No due date"}
        </span>
        <Calendar className="size-3.5 shrink-0 text-hub-foreground/35" aria-hidden />
      </button>
      <input
        ref={inputRef}
        type="datetime-local"
        value={value ? toDatetimeLocalValue(value) : ""}
        onChange={(event) => {
          const dueAt = event.target.value
            ? new Date(event.target.value).toISOString()
            : null;
          onChange(dueAt);
        }}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
      />
    </div>
  );
}
