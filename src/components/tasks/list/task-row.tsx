"use client";

import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Indent, Outdent, Trash2 } from "lucide-react";
import { useState } from "react";

import { TaskCompleteCheckbox } from "@/components/tasks/shared/task-complete-checkbox";
import { TaskDueBadge } from "@/components/tasks/shared/task-due-badge";
import { TaskLabelChip } from "@/components/tasks/shared/task-label-chip";
import { TaskPriorityBadge } from "@/components/tasks/shared/task-priority-badge";
import { HubTooltip } from "@/components/ui/hub-tooltip";
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
  onDelete?: (taskId: string) => void;
  completeTooltip?: string;
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
  onDelete,
  completeTooltip = "Complete task",
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
        <HubTooltip label="Drag to reorder" side="top">
          <button
            type="button"
            className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-[4px] text-hub-foreground/25 opacity-0 transition-opacity hover:text-hub-foreground/50 group-hover:opacity-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-4" />
          </button>
        </HubTooltip>
      )}

      <HubTooltip
        label={task.completed ? "Mark incomplete" : completeTooltip}
        side="top"
      >
        <span className="inline-flex shrink-0">
          <TaskCompleteCheckbox
            completed={task.completed}
            onToggle={() => onComplete(task.id)}
            disabled={!editable}
            size="sm"
          />
        </span>
      </HubTooltip>

      <button
        type="button"
        onClick={() => onOpen(task)}
        aria-label={`Open task: ${task.name}`}
        title="View task details"
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
        <ChevronRight
          className="ml-auto size-4 shrink-0 text-hub-foreground/25 transition-[color,opacity,transform] group-hover:translate-x-0.5 group-hover:text-hub-foreground/55 sm:opacity-0 sm:group-hover:opacity-100"
          strokeWidth={2.25}
          aria-hidden
        />
      </button>

      {editable && onIndent && (
        <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          {depth === 0 && siblingAboveId && (
            <HubTooltip label="Make sub-task" side="top">
              <button
                type="button"
                aria-label="Make sub-task"
                onClick={(event) => {
                  event.stopPropagation();
                  onIndent(task.id, siblingAboveId);
                }}
                className="flex size-8 items-center justify-center rounded-[4px] text-hub-foreground/40 hover:bg-hub-foreground/5 hover:text-hub-foreground"
              >
                <Indent className="size-3.5" />
              </button>
            </HubTooltip>
          )}
          {depth > 0 && (
            <HubTooltip label="Outdent to top level" side="top">
              <button
                type="button"
                aria-label="Outdent task"
                onClick={(event) => {
                  event.stopPropagation();
                  onIndent(task.id, null);
                }}
                className="flex size-8 items-center justify-center rounded-[4px] text-hub-foreground/40 hover:bg-hub-foreground/5 hover:text-hub-foreground"
              >
                <Outdent className="size-3.5" />
              </button>
            </HubTooltip>
          )}
        </div>
      )}

      {editable && onDelete && (
        <HubTooltip label="Delete task" side="top">
          <button
            type="button"
            aria-label="Delete task"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task.id);
            }}
            className="flex size-8 shrink-0 items-center justify-center rounded-[4px] text-hub-foreground/30 opacity-0 transition-[color,opacity] hover:bg-hub-rejected/10 hover:text-hub-rejected group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
          </button>
        </HubTooltip>
      )}
    </div>
  );
}
