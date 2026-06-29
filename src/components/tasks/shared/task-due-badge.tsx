import { formatTaskDueDate } from "@/lib/tasks/format-due-date";
import { cn } from "@/lib/utils";

type TaskDueBadgeProps = {
  dueAt: string | null;
  className?: string;
  variant?: "default" | "header";
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function TaskDueBadge({
  dueAt,
  className,
  variant = "default",
}: TaskDueBadgeProps) {
  if (!dueAt) return null;

  const due = new Date(dueAt);
  const now = new Date();
  const overdue = due < startOfDay(now);
  const today =
    due >= startOfDay(now) &&
    due <= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const label = formatTaskDueDate(dueAt);

  return (
    <span
      className={cn(
        variant === "header"
          ? "max-w-[11rem] truncate text-[0.6875rem] leading-none"
          : "text-[0.6875rem]",
        overdue
          ? "font-normal text-hub-overdue"
          : today
            ? "font-medium text-hub-primary"
            : "font-medium text-hub-foreground/50",
        className,
      )}
    >
      {variant === "default" && (overdue ? "Overdue · " : today ? "Today · " : "")}
      {label}
    </span>
  );
}
