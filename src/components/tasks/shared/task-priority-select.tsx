"use client";

import { HubSelect } from "@/components/ui/hub-select";
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_OPTIONS } from "@/lib/tasks/constants";
import type { TaskPriority } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPrioritySelectProps = {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
};

function PriorityLabel({ priority, label }: { priority: TaskPriority; label: string }) {
  const style = TASK_PRIORITY_COLORS[priority];

  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2 shrink-0 rounded-full", style.dot)} aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export function TaskPrioritySelect({ value, onChange, disabled }: TaskPrioritySelectProps) {
  const style = TASK_PRIORITY_COLORS[value];

  return (
    <HubSelect
      value={String(value)}
      onChange={(next) => onChange(Number(next) as TaskPriority)}
      disabled={disabled}
      options={TASK_PRIORITY_OPTIONS.map((option) => ({
        value: String(option.value),
        label: option.label,
      }))}
      className={cn("w-full border", style.bg, style.border, style.text)}
      formatLabel={(label) => label}
      variant="field"
      renderSelectedLabel={() => (
        <PriorityLabel priority={value} label={style.fullLabel} />
      )}
      renderOptionLabel={(option) => (
        <PriorityLabel
          priority={Number(option.value) as TaskPriority}
          label={option.label}
        />
      )}
    />
  );
}
