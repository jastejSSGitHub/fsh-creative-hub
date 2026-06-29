export type TaskAddedDetail = {
  taskId: string;
  taskName: string;
  projectId?: string | null;
};

export const TASK_ADDED_EVENT = "fsh-task-added";
export const TASK_DEEP_LINK_NAME_KEY = "fsh-task-deep-link-name";

export function stashTaskDeepLinkName(taskName: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TASK_DEEP_LINK_NAME_KEY, taskName);
  } catch {
    // ignore
  }
}

export function consumeTaskDeepLinkName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const name = sessionStorage.getItem(TASK_DEEP_LINK_NAME_KEY);
    if (name) sessionStorage.removeItem(TASK_DEEP_LINK_NAME_KEY);
    return name;
  } catch {
    return null;
  }
}

export function notifyTaskAdded(detail: TaskAddedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TaskAddedDetail>(TASK_ADDED_EVENT, { detail }));
}
