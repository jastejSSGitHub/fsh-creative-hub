"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { QuickAddChips } from "@/components/tasks/quick-add/quick-add-chips";
import {
  hubDialogFieldClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import { createTaskFromQuickAddAction } from "@/lib/tasks/actions";
import {
  highlightDateRange,
  parseQuickAdd,
  quickAddToChips,
} from "@/lib/tasks/quick-add/parse-quick-add";
import type { HubLabel, HubProfile } from "@/types/database";
import { cn } from "@/lib/utils";

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
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, initialValue]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed.name.trim()) {
      setError("Enter a task name.");
      return;
    }

    startTransition(async () => {
      const result = await createTaskFromQuickAddAction(
        parsed,
        projects,
        members,
        labels,
        linkAssetId ? { assetId: linkAssetId } : undefined,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValue("");
      onCreated?.();
      onClose();
    });
  }

  if (!open) return null;

  return (
    <HubDialog
      open={open}
      onClose={onClose}
      title="Quick add task"
      description="Type naturally — dates, #project, @label, p1–p4, +assignee."
      className="w-[min(100vw-2rem,36rem)]"
    >
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
