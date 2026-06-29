"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { QuickAddChips } from "@/components/tasks/quick-add/quick-add-chips";
import { QuickAddPendingState } from "@/components/tasks/quick-add/quick-add-pending-state";
import { QuickAddSuccessState } from "@/components/tasks/quick-add/quick-add-success-state";
import {
  hubDialogFieldClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import { fireTaskAddedConfetti } from "@/lib/confetti";
import { createTaskFromQuickAddAction } from "@/lib/tasks/actions";
import {
  highlightDateRange,
  parseQuickAdd,
  quickAddToChips,
} from "@/lib/tasks/quick-add/parse-quick-add";
import { notifyTaskAdded } from "@/lib/tasks/task-added-feedback";
import type { HubLabel, HubProfile } from "@/types/database";
import { cn } from "@/lib/utils";

const SUCCESS_CLOSE_MS = 800;

type QuickAddPanelProps = {
  open: boolean;
  onClose: () => void;
  projects: { id: string; name: string }[];
  labels: HubLabel[];
  members: Pick<HubProfile, "id" | "display_name">[];
  defaultProjectId?: string | null;
  initialValue?: string;
  linkAssetId?: string | null;
  onCreated?: () => void;
};

export function QuickAddPanel({
  open,
  onClose,
  projects,
  labels,
  members,
  defaultProjectId,
  initialValue = "",
  linkAssetId = null,
  onCreated,
}: QuickAddPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successTaskName, setSuccessTaskName] = useState<string | null>(null);
  const [pendingTaskName, setPendingTaskName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsed = parseQuickAdd(value, projects);
  if (defaultProjectId && !value.includes("#")) {
    const project = projects.find((p) => p.id === defaultProjectId);
    if (project) {
      parsed.projectId = project.id;
      parsed.projectName = project.name;
      parsed.isInbox = false;
    }
  }

  const chips = quickAddToChips(parsed);
  const highlight = highlightDateRange(value);
  const showingSuccess = successTaskName !== null;
  const showingPending = pendingTaskName !== null;

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
      setSuccessTaskName(null);
      setPendingTaskName(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, initialValue]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function handleClose() {
    if (showingSuccess || showingPending) return;
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (showingSuccess || !parsed.name.trim()) {
      if (!parsed.name.trim()) setError("Enter a task name.");
      return;
    }

    const taskName = parsed.name.trim();
    const projectId =
      parsed.isInbox && !parsed.projectId ? null : (parsed.projectId ?? null);

    setError(null);
    setPendingTaskName(taskName);

    startTransition(async () => {
      const result = await createTaskFromQuickAddAction(
        parsed,
        projects,
        members,
        labels,
        linkAssetId ? { assetId: linkAssetId } : undefined,
      );
      if (!result.ok) {
        setPendingTaskName(null);
        setError(result.error);
        return;
      }

      setPendingTaskName(null);
      setSuccessTaskName(taskName);
      fireTaskAddedConfetti();

      if (result.taskId) {
        notifyTaskAdded({
          taskId: result.taskId,
          taskName,
          projectId,
        });
      }

      closeTimerRef.current = window.setTimeout(() => {
        setValue("");
        setSuccessTaskName(null);
        setPendingTaskName(null);
        onCreated?.();
        onClose();
      }, SUCCESS_CLOSE_MS);
    });
  }

  if (!open) return null;

  return (
    <HubDialog
      open={open}
      onClose={handleClose}
      title={
        showingSuccess
          ? "Task added"
          : showingPending
            ? "Adding your task"
            : "Quick add task"
      }
      description={
        showingSuccess || showingPending
          ? undefined
          : "Type naturally — dates, #project, @label, p1–p4, +assignee."
      }
      className="w-[min(100vw-2rem,36rem)]"
      onBackdropAttempt={showingSuccess || showingPending ? () => {} : undefined}
      headerAction={
        showingSuccess ? (
          <span className="sr-only" aria-live="polite">
            Task saved successfully
          </span>
        ) : showingPending ? (
          <span className="sr-only" aria-live="polite">
            Adding task, please wait
          </span>
        ) : undefined
      }
    >
      {showingSuccess && successTaskName ? (
        <QuickAddSuccessState taskName={successTaskName} />
      ) : showingPending && pendingTaskName ? (
        <QuickAddPendingState taskName={pendingTaskName} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="rounded-[6px] border border-hub-rejected/30 bg-hub-rejected/10 px-3 py-2 text-xs text-hub-rejected">
              {error}
            </p>
          )}

          <div className="relative">
            {highlight && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6px] border border-transparent px-2.5 py-2 text-[0.8125rem] leading-normal text-transparent"
              >
                {value.slice(0, highlight.start)}
                <mark className="rounded bg-hub-primary/20 text-transparent">
                  {highlight.text}
                </mark>
                {value.slice(highlight.end)}
              </div>
            )}
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={isPending}
              placeholder="Review homepage tomorrow 9am #Blenz @design +Preeti p1"
              className={cn(hubDialogFieldClassName, "relative bg-transparent py-2")}
            />
          </div>

          <QuickAddChips chips={chips} />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isPending || !parsed.name.trim()}
              className={hubDialogPrimaryButtonClassName}
            >
              {isPending ? "Adding…" : "Add task"}
            </button>
          </div>
        </form>
      )}
    </HubDialog>
  );
}

export function QuickAddHost({
  projects,
  labels,
  members,
  defaultProjectId,
  initialValue,
  onCreated,
}: Omit<QuickAddPanelProps, "open" | "onClose">) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === "q" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target as HTMLElement).isContentEditable
      ) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <QuickAddPanel
      open={open}
      onClose={() => setOpen(false)}
      projects={projects}
      labels={labels}
      members={members}
      defaultProjectId={defaultProjectId}
      initialValue={initialValue}
      onCreated={onCreated}
    />
  );
}
