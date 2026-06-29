import { TASK_PRIORITY_COLORS } from "@/lib/tasks/constants";
import type { TaskPriority } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPriorityBadgeProps = {
  priority: TaskPriority;
  className?: string;
};

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const style = TASK_PRIORITY_COLORS[priority];
  if (priority === 4) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[0.6875rem] font-semibold",
        style.text,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}
