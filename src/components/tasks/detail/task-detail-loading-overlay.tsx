"use client";

import { HubDialog } from "@/components/projects/hub-dialog";
import { LoadingAffirmation } from "@/components/hub/loading-affirmation";
import { SkeletonBone } from "@/components/ui/skeleton-primitives";

const TASK_DETAIL_LOADING_MESSAGES = [
  "Opening your task…",
  "Loading task details…",
  "Pulling in comments…",
  "Gathering context…",
  "Almost ready…",
] as const;

type TaskDetailLoadingOverlayProps = {
  taskName?: string;
};

export function TaskDetailLoadingOverlay({ taskName }: TaskDetailLoadingOverlayProps) {
  return (
    <HubDialog
      open
      onClose={() => {}}
      onBackdropAttempt={() => {}}
      title="Task details"
      description={
        taskName ? `Opening “${taskName}”` : "Redirecting you to your task…"
      }
      className="w-[min(100vw-2rem,32rem)]"
    >
      <div className="space-y-4" aria-busy="true" aria-label="Loading task details">
        <div className="flex items-center gap-3">
          <SkeletonBone className="size-5 shrink-0 rounded-full" />
          <SkeletonBone className="h-5 flex-1 rounded-md" />
        </div>

        <SkeletonBone className="h-20 w-full rounded-[6px]" />

        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonBone className="h-10 w-full rounded-[6px]" />
          <SkeletonBone className="h-10 w-full rounded-[6px]" />
        </div>

        <div className="space-y-2 border-t border-hub-foreground/10 pt-4">
          <SkeletonBone className="h-3 w-16" />
          <SkeletonBone className="h-14 w-full rounded-[6px]" />
          <SkeletonBone className="h-14 w-full rounded-[6px]" />
        </div>

        <LoadingAffirmation
          messages={TASK_DETAIL_LOADING_MESSAGES}
          delayMs={0}
          className="pt-2"
        />
      </div>
    </HubDialog>
  );
}
