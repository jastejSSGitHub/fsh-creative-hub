import { TasksMainWorkspaceShell } from "@/components/tasks/tasks-main-workspace-shell";
import { loadMainTasksViewData } from "@/lib/tasks/load-main-views-data";

export default async function TasksMainViewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await loadMainTasksViewData();

  return (
    <>
      <TasksMainWorkspaceShell {...data} />
      {children}
    </>
  );
}
