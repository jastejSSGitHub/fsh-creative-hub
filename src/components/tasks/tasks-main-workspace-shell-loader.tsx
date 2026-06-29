import { TasksMainWorkspaceShell } from "@/components/tasks/tasks-main-workspace-shell";
import { loadMainTasksViewData } from "@/lib/tasks/load-main-views-data";

export async function TasksMainWorkspaceShellLoader() {
  const data = await loadMainTasksViewData();
  return <TasksMainWorkspaceShell {...data} />;
}
