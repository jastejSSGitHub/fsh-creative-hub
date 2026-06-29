"use client";

import type { SectionWithTasks, TaskWithMeta } from "@/lib/tasks/types";
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
  const visibleSections = sections.filter((s) => s.name);

  if (!visibleSections.length) {
    return <TasksEmptyState variant="board" />;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {visibleSections.map((section) => (
        <div
          key={section.id}
          className="flex w-[17rem] shrink-0 flex-col rounded-[8px] border border-hub-foreground/10 bg-hub-surface/70"
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
            {section.tasks.map((task) => (
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
