import { Suspense } from "react";

import { TasksMainWorkspaceShellLoader } from "@/components/tasks/tasks-main-workspace-shell-loader";
import { TasksPageFallback } from "@/components/tasks/tasks-page-fallback";

export default function TasksMainViewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<TasksPageFallback />}>
        <TasksMainWorkspaceShellLoader />
      </Suspense>
      {children}
    </>
  );
}
