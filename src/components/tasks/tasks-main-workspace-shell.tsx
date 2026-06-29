"use client";

import { TasksNavigationProvider, useTasksNavigation } from "@/components/tasks/tasks-navigation-context";
import { TasksWorkspaceClient } from "@/components/tasks/tasks-workspace-client";
import type { MainTasksViewData } from "@/lib/tasks/load-main-views-data";
import { taskViewFromPath } from "@/lib/tasks/main-view-config";

type TasksMainWorkspaceShellProps = MainTasksViewData;

function TasksMainWorkspaceContent({
  userId,
  userDisplayName,
  tasks,
  labels,
  filters,
  projects,
  members,
}: TasksMainWorkspaceShellProps) {
  const { pathname } = useTasksNavigation();
  const view = taskViewFromPath(pathname, filters, labels);

  if (!view) return null;

  return (
    <TasksWorkspaceClient
      key={pathname}
      viewKind={view.viewKind}
      title={view.title}
      userId={userId}
      userDisplayName={userDisplayName}
      initialTasks={tasks}
      labels={labels}
      filters={filters}
      projects={projects}
      members={members as import("@/types/database").HubProfile[]}
      filterQuery={view.filterQuery}
      labelSlug={view.labelSlug}
    />
  );
}

export function TasksMainWorkspaceShell(props: TasksMainWorkspaceShellProps) {
  return (
    <TasksNavigationProvider>
      <TasksMainWorkspaceContent {...props} />
    </TasksNavigationProvider>
  );
}
