import { cn } from "@/lib/utils";

type TaskLabelChipProps = {
  name: string;
  color: string;
  className?: string;
};

export function TaskLabelChip({ name, color, className }: TaskLabelChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[0.625rem] font-medium text-hub-foreground/75",
        className,
      )}
      style={{ backgroundColor: `${color}22`, color }}
    >
      @{name}
    </span>
  );
}
