"use client";

import { TasksMainWorkspaceShell } from "@/components/tasks/tasks-main-workspace-shell";
import { TasksWorkspaceSkeleton } from "@/components/tasks/tasks-workspace-skeleton";
import { useDeferredHubTabCache } from "@/lib/hub/use-deferred-hub-tab-cache";
import type { MainTasksViewData } from "@/lib/tasks/load-main-views-data";

export function TasksPageFallback() {
  const cached = useDeferredHubTabCache<MainTasksViewData>("tasks");

  if (cached) {
    return <TasksMainWorkspaceShell {...cached} />;
  }

  return <TasksWorkspaceSkeleton />;
}
