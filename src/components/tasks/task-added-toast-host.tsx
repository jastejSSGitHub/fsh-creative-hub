"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  TASK_ADDED_EVENT,
  stashTaskDeepLinkName,
  type TaskAddedDetail,
} from "@/lib/tasks/task-added-feedback";
import { navigateHubContent } from "@/lib/hub/navigate-hub-content";
import { taskDeepLinkPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

const DISMISS_MS = 5000;

export function TaskAddedToastHost() {
  const router = useRouter();
  const [toast, setToast] = useState<TaskAddedDetail | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onTaskAdded(event: Event) {
      const detail = (event as CustomEvent<TaskAddedDetail>).detail;
      setToast(detail);
      setVisible(true);
    }

    window.addEventListener(TASK_ADDED_EVENT, onTaskAdded);
    return () => window.removeEventListener(TASK_ADDED_EVENT, onTaskAdded);
  }, []);

  useEffect(() => {
    if (!visible || !toast) return;
    const timer = window.setTimeout(() => setVisible(false), DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [visible, toast]);

  useEffect(() => {
    if (visible || !toast) return;
    const timer = window.setTimeout(() => setToast(null), 220);
    return () => window.clearTimeout(timer);
  }, [visible, toast]);

  useEffect(() => {
    if (!toast) return;
    const href = taskDeepLinkPath(toast.taskId, toast.projectId);
    router.prefetch(href);
  }, [router, toast]);

  if (!toast) return null;

  const href = taskDeepLinkPath(toast.taskId, toast.projectId);

  function handleViewTask() {
    stashTaskDeepLinkName(toast!.taskName);
    setVisible(false);
    navigateHubContent(router, {
      href,
      label: toast!.taskName,
      kindHint: "task",
    });
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-4 bottom-[max(5rem,env(safe-area-inset-bottom))] z-[65] flex justify-center lg:bottom-6",
        visible
          ? "animate-in fade-in slide-in-from-bottom-2 duration-300"
          : "animate-out fade-out slide-out-to-bottom-2 duration-200",
      )}
    >
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-hub-final/25 bg-hub-espresso px-4 py-3 text-sm text-white shadow-xl">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hub-approved/20 text-hub-approved"
          aria-hidden
        >
          <svg viewBox="0 0 16 16" fill="none" className="size-4">
            <path
              d="M4 8.25L6.75 11 12 5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">Task added</p>
          <p className="truncate text-white/75">{toast.taskName}</p>
        </div>
        <button
          type="button"
          onClick={handleViewTask}
          className="shrink-0 rounded-md px-2 py-1 font-medium text-hub-butter underline-offset-2 transition-colors hover:bg-white/10 hover:text-white hover:underline"
        >
          View task
        </button>
      </div>
    </div>
  );
}
