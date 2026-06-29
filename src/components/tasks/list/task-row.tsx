"use client";

import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Indent, Outdent } from "lucide-react";
import { useState } from "react";

import { TaskCompleteCheckbox } from "@/components/tasks/shared/task-complete-checkbox";
import { TaskDueBadge } from "@/components/tasks/shared/task-due-badge";
import { TaskLabelChip } from "@/components/tasks/shared/task-label-chip";
import { TaskPriorityBadge } from "@/components/tasks/shared/task-priority-badge";
import type { TaskWithMeta } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskRowProps = {
  task: TaskWithMeta;
  depth?: number;
  editable: boolean;
  onComplete: (taskId: string) => void;
  onOpen: (task: TaskWithMeta) => void;
  sortableId?: string;
  onSwipeComplete?: (taskId: string) => void;
  onIndent?: (taskId: string, parentId: string | null) => void;
  siblingAboveId?: string | null;
};

export function TaskRow({
  task,
  depth = 0,
  editable,
  onComplete,
  onOpen,
  sortableId,
  onSwipeComplete,
  onIndent,
  siblingAboveId,
}: TaskRowProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId ?? task.id, disabled: !editable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleTouchStart(event: React.TouchEvent) {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX == null || !onSwipeComplete) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX;
    if (delta > 72) onSwipeComplete(task.id);
    setTouchStartX(null);
  }

  return (
    <div
      ref={setNodeRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "group flex min-h-11 items-center gap-2 rounded-[6px] border border-hub-foreground/[0.08] bg-hub-surface px-2 py-1.5 shadow-[0_1px_2px_rgba(11,11,11,0.03)] transition-[background-color,border-color,box-shadow] hover:border-hub-foreground/15 hover:bg-hub-surface hover:shadow-[0_2px_6px_rgba(11,11,11,0.07)]",
        isDragging && "z-10 border-hub-foreground/18 bg-hub-surface shadow-md",
        task.completed && "opacity-60",
      )}
      style={{
        ...style,
        paddingLeft: `${8 + depth * 20}px`,
      }}
    >
      {editable && (
        <button
          type="button"
          className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-[4px] text-hub-foreground/25 opacity-0 transition-opacity hover:text-hub-foreground/50 group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      )}

      <TaskCompleteCheckbox
        completed={task.completed}
        onToggle={() => onComplete(task.id)}
        disabled={!editable}
        size="sm"
      />

      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={cn(
            "truncate text-[0.8125rem] font-medium text-hub-foreground",
            task.completed && "line-through text-hub-foreground/45",
          )}
        >
          {task.name}
        </span>
        <TaskPriorityBadge priority={task.priority} />
        <TaskDueBadge dueAt={task.due_at} className="hidden sm:inline" />
        <div className="hidden flex-wrap gap-1 md:flex">
          {task.labels.slice(0, 2).map((label) => (
            <TaskLabelChip key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
      </button>

      {editable && onIndent && (
        <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          {depth === 0 && siblingAboveId && (
            <button
              type="button"
              aria-label="Make sub-task"
              onClick={() => onIndent(task.id, siblingAboveId)}
              className="flex size-8 items-center justify-center rounded-[4px] text-hub-foreground/40 hover:bg-hub-foreground/5 hover:text-hub-foreground"
            >
              <Indent className="size-3.5" />
            </button>
          )}
          {depth > 0 && (
            <button
              type="button"
              aria-label="Outdent task"
              onClick={() => onIndent(task.id, null)}
              className="flex size-8 items-center justify-center rounded-[4px] text-hub-foreground/40 hover:bg-hub-foreground/5 hover:text-hub-foreground"
            >
              <Outdent className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
