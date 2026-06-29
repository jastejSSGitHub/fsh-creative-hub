"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { LayoutGrid, List } from "lucide-react";

import { ProjectPresenceStack } from "@/components/presence/project-presence-stack";
import { TaskBoardView } from "@/components/tasks/board/task-board-view";
import { TaskDetailOverlay } from "@/components/tasks/detail/task-detail-overlay";
import { TaskListView } from "@/components/tasks/list/task-list-view";
import { TasksBrowseView } from "@/components/tasks/tasks-browse-view";
import { QuickAddHost, QuickAddPanel } from "@/components/tasks/quick-add/quick-add-panel";
import { QuickAddTriggerButton } from "@/components/tasks/quick-add/quick-add-trigger-button";
import { TasksMobileViewTabs } from "@/components/tasks/mobile/tasks-mobile-view-tabs";
import { TasksNavigationProvider } from "@/components/tasks/tasks-navigation-context";
import { TasksSidebar } from "@/components/tasks/tasks-sidebar";
import { FilterBuilderDialog } from "@/components/tasks/filters/filter-builder-dialog";
import { NavBackLink } from "@/components/ui/nav-back-link";
import { HubConfirmDialog } from "@/components/ui/hub-confirm-dialog";
import { canEdit } from "@/lib/permissions";
import { projectPath } from "@/lib/routes";
import {
  completeTaskAction,
  createTaskAction,
  deleteTaskAction,
  reorderTasksAction,
  uncompleteTaskAction,
} from "@/lib/tasks/actions";
import {
  filterTasks,
  filterTasksForView,
  type FilterContext,
} from "@/lib/tasks/filters/evaluate-filter";
import { deriveTaskCreateDefaults } from "@/lib/tasks/derive-task-defaults";
import { projectTaskScopeFromSearch } from "@/lib/tasks/main-view-config";
import { requestCollaborationOnboarding } from "@/lib/collaboration-onboarding/events";
import { nestTasks } from "@/lib/tasks/queries";
import { getTeamLabelColor, teamAddTaskPlaceholder } from "@/lib/tasks/team-label-colors";
import type { SectionWithTasks, TasksLayout, TasksViewKind, TaskWithMeta } from "@/lib/tasks/types";
import type { HubFilter, HubLabel, HubProfile, HubProject, HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

const EMPTY_SECTIONS: SectionWithTasks[] = [];

type TasksWorkspaceClientProps = {
  viewKind: TasksViewKind;
  title: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string | null;
  initialTasks: TaskWithMeta[];
  initialSections?: SectionWithTasks[];
  labels: HubLabel[];
  filters: HubFilter[];
  projects: { id: string; name: string }[];
  members: HubProfile[];
  project?: HubProject;
  role?: HubRole;
  filterQuery?: string;
  labelSlug?: string;
};

export function TasksWorkspaceClient({
  viewKind,
  title,
  userId,
  userDisplayName,
  userAvatarUrl = null,
  initialTasks,
  initialSections = EMPTY_SECTIONS,
  labels,
  filters,
  projects,
  members,
  project,
  role,
  filterQuery,
  labelSlug,
}: TasksWorkspaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState(initialTasks);
  const [sections, setSections] = useState(initialSections);

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  const [layout, setLayout] = useState<TasksLayout>("list");
  const [selectedTask, setSelectedTask] = useState<TaskWithMeta | null>(null);

  useEffect(() => {
    if (viewKind === "project" && layout === "board") {
      requestCollaborationOnboarding("creative-board");
      requestCollaborationOnboarding("presence");
    }
  }, [layout, viewKind]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithMeta | null>(null);
  const [taskNotice, setTaskNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!taskNotice) return;
    const timer = window.setTimeout(() => setTaskNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [taskNotice]);

  useEffect(() => {
    setTasks((prev) => {
      const pending = prev.filter((t) => t.id.startsWith("optimistic-"));
      if (pending.length === 0) return initialTasks;

      const merged = [...initialTasks];
      for (const task of pending) {
        const alreadySaved = initialTasks.some(
          (saved) =>
            saved.name === task.name &&
            saved.due_at === task.due_at &&
            saved.assignee_id === task.assignee_id,
        );
        if (!alreadySaved) merged.push(task);
      }
      return merged;
    });
  }, [initialTasks]);

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId) return;
    const match = tasks.find((t) => t.id === taskId);
    if (match) setSelectedTask(match);
  }, [searchParams, tasks]);

  const editable = project ? canEdit(role ?? null) : true;

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const filterCtx: FilterContext = useMemo(
    () => ({ userId, userDisplayName }),
    [userId, userDisplayName],
  );

  const projectScope = useMemo(() => {
    if (viewKind !== "project" || !project) return null;
    return projectTaskScopeFromSearch(searchParams, filters, labels);
  }, [viewKind, project, searchParams, filters, labels]);

  const scopedFilterQuery =
    viewKind === "filter"
      ? filterQuery
      : projectScope?.filterQuery;
  const scopedLabelSlug =
    viewKind === "label" ? labelSlug : projectScope?.labelSlug;
  const displayTitle =
    viewKind === "project" && projectScope ? projectScope.title : title;

  const visibleTasks = useMemo(() => {
    let list = tasks.filter((t) => !t.completed);

    if (viewKind === "today" || viewKind === "upcoming" || viewKind === "inbox") {
      list = filterTasksForView(list, viewKind, filterCtx);
    }

    if (viewKind === "label" && labelSlug) {
      list = list.filter((t) =>
        t.labels.some((l) => l.name.toLowerCase() === labelSlug.toLowerCase()),
      );
    }

    if (viewKind === "filter" && filterQuery) {
      list = filterTasks(list, filterQuery, filterCtx);
    }

    if (viewKind === "project" && project) {
      list = list.filter((t) => t.project_id === project.id);

      if (projectScope?.view === "today" || projectScope?.view === "upcoming") {
        list = filterTasksForView(list, projectScope.view, filterCtx);
      }

      if (projectScope?.filterQuery) {
        list = filterTasks(list, projectScope.filterQuery, filterCtx);
      }

      if (projectScope?.labelSlug) {
        list = list.filter((t) =>
          t.labels.some(
            (l) => l.name.toLowerCase() === projectScope.labelSlug!.toLowerCase(),
          ),
        );
      }
    }

    return list;
  }, [
    tasks,
    viewKind,
    filterCtx,
    labelSlug,
    filterQuery,
    project,
    projectScope,
  ]);

  const flatForGlobal = useMemo(() => nestTasks(visibleTasks), [visibleTasks]);

  const activeLabel = useMemo(() => {
    if (!scopedLabelSlug) return null;
    return (
      labels.find(
        (entry) => entry.name.toLowerCase() === scopedLabelSlug.toLowerCase(),
      ) ?? null
    );
  }, [scopedLabelSlug, labels]);

  const taskCountsByLabel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      if (task.completed) continue;
      for (const label of task.labels) {
        const key = label.name.toLowerCase();
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [tasks]);

  const labelAddPlaceholder = activeLabel
    ? teamAddTaskPlaceholder(activeLabel.name)
    : undefined;

  const quickAddInitialValue = activeLabel ? `@${activeLabel.name} ` : "";

  const sectionData = useMemo(() => {
    if (viewKind === "project" && sections.length) {
      const nested = nestTasks(visibleTasks);
      return sections.map((section) => ({
        ...section,
        tasks: nested.filter((t) => t.section_id === section.id),
      }));
    }
    return sections;
  }, [viewKind, sections, visibleTasks]);

  function handleComplete(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    const isCompleted = task?.completed;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !isCompleted,
              completed_at: !isCompleted ? new Date().toISOString() : null,
            }
          : t,
      ),
    );

    startTransition(async () => {
      if (isCompleted) {
        await uncompleteTaskAction(taskId);
      } else {
        await completeTaskAction(taskId);
      }
      refresh();
    });
  }

  function handleDeleteRequest(taskId: string) {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) return;
    setTaskToDelete(task);
  }

  function handleConfirmDelete() {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    setTaskToDelete(null);
    setTasks((prev) => prev.filter((entry) => entry.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);

    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (!result.ok) {
        setTaskNotice({ type: "error", message: result.error });
        refresh();
        return;
      }
      setTaskNotice({ type: "success", message: "Task deleted" });
      refresh();
    });
  }

  async function handleAddTask(sectionId: string | null, name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const defaults = deriveTaskCreateDefaults({
      viewKind:
        projectScope?.view ??
        (scopedLabelSlug ? "label" : scopedFilterQuery ? "filter" : viewKind),
      filterQuery: scopedFilterQuery,
      labelSlug: scopedLabelSlug,
      userId,
      labels,
    });

    const projectId = project?.id ?? defaults.projectId ?? null;
    const labelEntries = (defaults.labelIds ?? []).flatMap((id) => {
      const label = labels.find((l) => l.id === id);
      return label ? [label] : [];
    });

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticTask: TaskWithMeta = {
      id: optimisticId,
      project_id: projectId,
      section_id: sectionId,
      parent_id: null,
      name: trimmed,
      description: null,
      due_at: defaults.dueAt ?? null,
      priority: 4,
      assignee_id: defaults.assigneeId ?? null,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: userId,
      sort_order: tasks.length,
      created_at: new Date().toISOString(),
      labels: labelEntries,
      assignee:
        defaults.assigneeId === userId
          ? { id: userId, display_name: userDisplayName, avatar_url: null }
          : null,
      project: project ? { id: project.id, name: project.name } : null,
    };

    setTasks((prev) => [...prev, optimisticTask]);

    const result = await createTaskAction({
      name: trimmed,
      projectId,
      sectionId,
      sortOrder: tasks.length,
      dueAt: defaults.dueAt ?? null,
      assigneeId: defaults.assigneeId ?? null,
      labelIds: defaults.labelIds,
    });

    if (!result.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
      setTaskNotice({ type: "error", message: result.error });
      throw new Error(result.error);
    }

    if (result.taskId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === optimisticId ? { ...t, id: result.taskId! } : t)),
      );
    }

    setTaskNotice({ type: "success", message: `"${trimmed}" added` });
    refresh();
    return true;
  }

  function handleIndent(taskId: string, parentId: string | null) {
    startTransition(async () => {
      await reorderTasksAction([{ id: taskId, sortOrder: 0, parentId }]);
      refresh();
    });
  }

  function handleReorder(
    updates: { id: string; sortOrder: number; sectionId?: string | null; parentId?: string | null }[],
  ) {
    startTransition(async () => {
      await reorderTasksAction(updates);
      refresh();
    });
  }

  const emptyStateVariant = useMemo((): "today" | "upcoming" | "inbox" | "default" => {
    if (projectScope?.view === "today" || viewKind === "today") return "today";
    if (projectScope?.view === "upcoming" || viewKind === "upcoming") return "upcoming";
    if (viewKind === "inbox") return "inbox";
    return "default";
  }, [viewKind, projectScope?.view]);
  const globalTaskListProps =
    viewKind !== "project"
      ? {
          onDelete: handleDeleteRequest,
          completeTooltip:
            viewKind === "inbox"
              ? "Complete task — removes from Inbox"
              : "Complete task",
        }
      : {};

  const labelEmptyCopy = activeLabel
    ? {
        title: `No @${activeLabel.name} tasks yet`,
        description: `This view shows open tasks tagged @${activeLabel.name}. Add one below and it will be tagged for the team automatically.`,
      }
    : null;

  return (
    <TasksNavigationProvider>
    <div className="flex min-h-0 flex-1 flex-col pb-6 lg:pb-0">
      {viewKind !== "project" && <TasksMobileViewTabs />}
      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="hidden lg:block">
          <TasksSidebar
            filters={filters}
            labels={labels}
            taskCountsByLabel={taskCountsByLabel}
            projectId={project?.id}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              {project && (
                <NavBackLink
                  href={projectPath(project.id)}
                  label={project.name}
                  className="w-fit shrink-0"
                />
              )}
              <h1 className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-hub-foreground">
                {activeLabel && (
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getTeamLabelColor(activeLabel.name) }}
                    aria-hidden
                  />
                )}
                <span>{displayTitle}</span>
                {project && (
                  <ProjectPresenceStack
                    projectId={project.id}
                    userId={userId}
                    displayName={userDisplayName}
                    avatarUrl={userAvatarUrl}
                    className="ml-1"
                  />
                )}
              </h1>
              {activeLabel && (
                <p className="text-[0.75rem] text-hub-foreground/50">
                  {visibleTasks.length === 0
                    ? "No open tasks for this team"
                    : `${visibleTasks.length} open task${visibleTasks.length === 1 ? "" : "s"}`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {viewKind === "project" && (
                <div className="flex rounded-[6px] border border-hub-foreground/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => setLayout("list")}
                    className={cn(
                      "flex min-h-9 min-w-9 items-center justify-center rounded-[4px]",
                      layout === "list" && "bg-hub-espresso text-hub-paper",
                    )}
                    aria-label="List layout"
                  >
                    <List className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayout("board")}
                    className={cn(
                      "flex min-h-9 min-w-9 items-center justify-center rounded-[4px]",
                      layout === "board" && "bg-hub-espresso text-hub-paper",
                    )}
                    aria-label="Board layout"
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                </div>
              )}

              <QuickAddTriggerButton
                size="header"
                onClick={() => setQuickAddOpen(true)}
              />
            </div>
          </div>

          {viewKind === "browse" ? (
            <TasksBrowseView
              filters={filters}
              labels={labels}
              taskCountsByLabel={taskCountsByLabel}
              onRefresh={refresh}
            />
          ) : viewKind === "project" && layout === "board" ? (
            <TaskBoardView
              sections={sectionData}
              editable={editable}
              onComplete={handleComplete}
              onOpen={setSelectedTask}
            />
          ) : viewKind === "project" ? (
            <TaskListView
              sections={sectionData}
              editable={editable}
              onComplete={handleComplete}
              onOpen={setSelectedTask}
              onReorder={handleReorder}
              onAddTask={handleAddTask}
              onIndent={handleIndent}
              onQuickAdd={() => setQuickAddOpen(true)}
            />
          ) : (
            <TaskListView
              flatTasks={flatForGlobal}
              editable={editable}
              onComplete={handleComplete}
              onOpen={setSelectedTask}
              onReorder={handleReorder}
              onAddTask={(sectionId, name) => handleAddTask(sectionId, name)}
              onIndent={handleIndent}
              showSections={false}
              emptyStateVariant={emptyStateVariant}
              emptyStateTitle={labelEmptyCopy?.title}
              emptyStateDescription={labelEmptyCopy?.description}
              addTaskPlaceholder={labelAddPlaceholder}
              onQuickAdd={() => setQuickAddOpen(true)}
              {...globalTaskListProps}
            />
          )}

          {viewKind !== "project" && viewKind !== "browse" && (
            <p className="mt-6 text-center text-[0.6875rem] text-hub-foreground/40">
              Press <kbd className="rounded border border-hub-foreground/15 px-1">Q</kbd> for
              Quick Add ·{" "}
              <button
                type="button"
                onClick={() => setFilterDialogOpen(true)}
                className="underline hover:text-hub-foreground/60"
              >
                Create filter
              </button>
            </p>
          )}
        </div>
      </div>

      <QuickAddHost
        projects={projects}
        labels={labels}
        members={members}
        defaultProjectId={project?.id}
        initialValue={quickAddInitialValue}
        onCreated={() => {
          setTaskNotice({ type: "success", message: "Task added" });
          refresh();
        }}
      />

      {quickAddOpen && (
        <QuickAddPanel
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          projects={projects}
          labels={labels}
          members={members}
          defaultProjectId={project?.id}
          initialValue={quickAddInitialValue}
          onCreated={() => {
            setTaskNotice({ type: "success", message: "Task added" });
            refresh();
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailOverlay
          task={selectedTask}
          role={role ?? null}
          userId={userId}
          userDisplayName={userDisplayName}
          userAvatarUrl={userAvatarUrl}
          members={members}
          labels={labels}
          projects={projects}
          sections={sections.map((s) => ({ id: s.id, name: s.name }))}
          onClose={() => {
            setSelectedTask(null);
            if (searchParams.get("task")) {
              const url = new URL(window.location.href);
              url.searchParams.delete("task");
              router.replace(url.pathname + url.search);
            }
          }}
          onUpdated={refresh}
        />
      )}

      <FilterBuilderDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onCreated={refresh}
      />

      <HubConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete task?"
        description={
          taskToDelete ? (
            <>
              <span className="font-medium text-hub-foreground">{taskToDelete.name}</span> will be
              permanently removed along with its comments.
            </>
          ) : null
        }
        confirmLabel="Delete task"
        tone="danger"
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {taskNotice && (
        <div
          role="status"
          className={cn(
            "fixed inset-x-4 bottom-[max(5rem,env(safe-area-inset-bottom))] z-[60] rounded-lg border px-4 py-3 text-sm shadow-xl sm:inset-x-auto sm:right-6 sm:max-w-sm",
            taskNotice.type === "success"
              ? "border-hub-final/25 bg-hub-espresso text-white"
              : "border-hub-rejected/20 bg-hub-espresso text-white",
          )}
        >
          <p className="font-medium">
            {taskNotice.type === "success" ? "Task saved" : "Could not add task"}
          </p>
          <p className="mt-0.5 text-white/80">{taskNotice.message}</p>
        </div>
      )}
    </div>
    </TasksNavigationProvider>
  );
}