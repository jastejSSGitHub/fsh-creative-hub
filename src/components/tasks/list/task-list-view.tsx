"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

import { TaskRow } from "@/components/tasks/list/task-row";
import { TasksEmptyState } from "@/components/tasks/shared/tasks-empty-state";
import type { SectionWithTasks, TaskWithMeta } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskListViewProps = {
  sections?: SectionWithTasks[];
  flatTasks?: TaskWithMeta[];
  editable: boolean;
  onComplete: (taskId: string) => void;
  onOpen: (task: TaskWithMeta) => void;
  onReorder: (
    updates: { id: string; sortOrder: number; sectionId?: string | null; parentId?: string | null }[],
  ) => void;
  onAddTask?: (sectionId: string | null, name: string) => Promise<boolean> | boolean | void;
  showSections?: boolean;
  onIndent?: (taskId: string, parentId: string | null) => void;
  emptyStateVariant?: "today" | "upcoming" | "inbox" | "default";
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  addTaskPlaceholder?: string;
  onQuickAdd?: () => void;
  onDelete?: (taskId: string) => void;
  completeTooltip?: string;
};

export function TaskListView({
  sections,
  flatTasks,
  editable,
  onComplete,
  onOpen,
  onReorder,
  onAddTask,
  showSections = true,
  onIndent,
  emptyStateVariant = "default",
  emptyStateTitle,
  emptyStateDescription,
  addTaskPlaceholder,
  onQuickAdd,
  onDelete,
  completeTooltip,
}: TaskListViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const displaySections = useMemo(() => {
    if (flatTasks) {
      return [
        {
          id: "flat",
          project_id: "",
          name: "",
          sort_order: 0,
          created_at: "",
          tasks: flatTasks.filter((t) => !t.parent_id),
        } satisfies SectionWithTasks,
      ];
    }
    return sections ?? [];
  }, [flatTasks, sections]);

  const allTaskIds = useMemo(
    () =>
      displaySections.flatMap((section) =>
        section.tasks.flatMap((task) => [
          task.id,
          ...(task.subtasks?.map((s) => s.id) ?? []),
        ]),
      ),
    [displaySections],
  );

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    for (const section of displaySections) {
      for (const task of section.tasks) {
        if (task.id === activeId) return task;
        const sub = task.subtasks?.find((s) => s.id === activeId);
        if (sub) return sub;
      }
    }
    return null;
  }, [activeId, displaySections]);

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = allTaskIds.indexOf(String(active.id));
    const newIndex = allTaskIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(allTaskIds, oldIndex, newIndex);
    onReorder(
      reordered.map((id, index) => ({
        id,
        sortOrder: index,
      })),
    );
  }

  const totalTasks = displaySections.reduce((n, s) => n + s.tasks.length, 0);

  if (totalTasks === 0) {
    return (
      <TasksEmptyState
        variant={emptyStateVariant}
        title={emptyStateTitle}
        description={emptyStateDescription}
        addTaskPlaceholder={addTaskPlaceholder}
        onQuickAdd={onQuickAdd}
        onAddTask={
          editable && onAddTask
            ? async (name) => {
                const result = await onAddTask(null, name);
                return result !== false;
              }
            : undefined
        }
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {displaySections.map((section) => (
          <div key={section.id}>
            {showSections && section.name && (
              <h3 className="mb-2 px-2 font-display text-xs font-bold uppercase tracking-wide text-hub-foreground/45">
                {section.name}
              </h3>
            )}
            <SortableContext
              items={section.tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {section.tasks.map((task, index) => (
                  <div key={task.id}>
                    <TaskRow
                      task={task}
                      editable={editable}
                      onComplete={onComplete}
                      onOpen={onOpen}
                      onSwipeComplete={onComplete}
                      onIndent={onIndent}
                      siblingAboveId={section.tasks[index - 1]?.id ?? null}
                      onDelete={onDelete}
                      completeTooltip={completeTooltip}
                    />
                    {task.subtasks?.map((subtask) => (
                      <TaskRow
                        key={subtask.id}
                        task={subtask}
                        depth={1}
                        editable={editable}
                        onComplete={onComplete}
                        onOpen={onOpen}
                        sortableId={subtask.id}
                        onSwipeComplete={onComplete}
                        onDelete={onDelete}
                        completeTooltip={completeTooltip}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </SortableContext>

            {editable && onAddTask && (
              <AddTaskInline
                placeholder={addTaskPlaceholder ?? "Add a task…"}
                onSubmit={(name) => onAddTask(section.id === "flat" || section.id === "unsectioned" ? null : section.id, name)}
              />
            )}
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-3 py-2 shadow-lg">
            <span className="text-[0.8125rem] font-medium">{activeTask.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function AddTaskInline({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (name: string) => Promise<boolean> | boolean | void;
}) {
  const [value, setValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  return (
    <form
      className="mt-1 px-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const name = value.trim();
        if (!name || isAdding) return;

        setIsAdding(true);
        try {
          const result = await onSubmit(name);
          if (result !== false) setValue("");
        } finally {
          setIsAdding(false);
        }
      }}
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={isAdding ? "Adding…" : placeholder}
        disabled={isAdding}
        className={cn(
          "w-full min-h-11 rounded-[6px] border border-transparent bg-transparent px-2 text-[0.8125rem] text-hub-foreground outline-none placeholder:text-hub-foreground/40 focus:border-hub-foreground/12 focus:bg-hub-surface disabled:opacity-60",
        )}
      />
    </form>
  );
}
