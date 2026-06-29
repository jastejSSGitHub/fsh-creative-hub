"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { SectionWithTasks, TaskWithMeta } from "@/lib/tasks/types";
import {
  BOARD_COLUMNS_PER_PAGE,
  normalizeBoardSections,
  paginateBoardSections,
} from "@/lib/tasks/board-sections";
import { TaskCompleteCheckbox } from "@/components/tasks/shared/task-complete-checkbox";
import { TaskDueBadge } from "@/components/tasks/shared/task-due-badge";
import { TaskPriorityBadge } from "@/components/tasks/shared/task-priority-badge";
import { TasksEmptyState } from "@/components/tasks/shared/tasks-empty-state";
import { cn } from "@/lib/utils";

type TaskBoardViewProps = {
  sections: SectionWithTasks[];
  editable: boolean;
  onComplete: (taskId: string) => void;
  onOpen: (task: TaskWithMeta) => void;
};

export function TaskBoardView({
  sections,
  editable,
  onComplete,
  onOpen,
}: TaskBoardViewProps) {
  const [page, setPage] = useState(0);

  const boardSections = useMemo(() => normalizeBoardSections(sections), [sections]);

  useEffect(() => {
    setPage(0);
  }, [boardSections]);

  const { page: safePage, pageCount, visibleSections } = useMemo(
    () => paginateBoardSections(boardSections, page),
    [boardSections, page],
  );

  if (!boardSections.length) {
    return <TasksEmptyState variant="board" />;
  }

  const columnStart = safePage * BOARD_COLUMNS_PER_PAGE + 1;
  const columnEnd = Math.min((safePage + 1) * BOARD_COLUMNS_PER_PAGE, boardSections.length);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid gap-3",
          visibleSections.length === 1 && "grid-cols-1",
          visibleSections.length === 2 && "grid-cols-1 sm:grid-cols-2",
          visibleSections.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {visibleSections.map((section) => (
          <div
            key={section.id}
            className="flex min-w-0 flex-col rounded-[8px] border border-hub-foreground/10 bg-hub-surface/70"
          >
            <div className="border-b border-hub-foreground/8 px-3 py-2.5">
              <h3 className="font-display text-xs font-bold text-hub-foreground/70">
                {section.name}
              </h3>
              <p className="text-[0.625rem] text-hub-foreground/40">
                {section.tasks.length} tasks
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2">
              {section.tasks.length === 0 ? (
                <p className="px-1 py-6 text-center text-[0.6875rem] text-hub-foreground/35">
                  No tasks in this column
                </p>
              ) : (
                section.tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpen(task)}
                    className={cn(
                      "rounded-[6px] border border-hub-foreground/10 bg-hub-paper p-3 text-left shadow-sm transition-colors hover:border-hub-foreground/15",
                      task.completed && "opacity-60",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <TaskCompleteCheckbox
                        completed={task.completed}
                        onToggle={() => onComplete(task.id)}
                        disabled={!editable}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-[0.8125rem] font-medium text-hub-foreground",
                            task.completed && "line-through text-hub-foreground/45",
                          )}
                        >
                          {task.name}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <TaskPriorityBadge priority={task.priority} />
                          <TaskDueBadge dueAt={task.due_at} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-hub-foreground/8 bg-hub-surface/50 px-3 py-2">
          <p className="text-[0.6875rem] text-hub-foreground/50">
            Columns {columnStart}–{columnEnd} of {boardSections.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous columns"
              disabled={safePage === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-[6px] border border-hub-foreground/10 text-hub-foreground/70 transition-colors",
                safePage === 0
                  ? "cursor-not-allowed opacity-40"
                  : "hover:border-hub-foreground/20 hover:bg-hub-paper",
              )}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="min-w-[4.5rem] text-center text-[0.6875rem] font-medium text-hub-foreground/60">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Next columns"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-[6px] border border-hub-foreground/10 text-hub-foreground/70 transition-colors",
                safePage >= pageCount - 1
                  ? "cursor-not-allowed opacity-40"
                  : "hover:border-hub-foreground/20 hover:bg-hub-paper",
              )}
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
