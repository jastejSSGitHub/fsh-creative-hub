"use client";

import { useRef, useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { buttonVariants } from "@/components/ui/button";
import { renameProjectAction } from "@/lib/projects/actions";
import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-md border border-hub-espresso/15 bg-white px-3.5 text-hub-espresso outline-none ring-hub-accent/40 placeholder:text-hub-espresso/35 focus:ring-2 disabled:opacity-60";

type RenameProjectDialogProps = {
  open: boolean;
  projectId: string | null;
  currentName: string;
  onClose: () => void;
  onRenamed?: () => void;
};

export function RenameProjectDialog({
  open,
  projectId,
  currentName,
  onClose,
  onRenamed,
}: RenameProjectDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setError(null);
    formRef.current?.reset();
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;

    setError(null);
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    startTransition(async () => {
      const result = await renameProjectAction(projectId, name);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      handleClose();
      onRenamed?.();
    });
  }

  return (
    <HubDialog
      open={open}
      onClose={handleClose}
      title="Rename project"
      description="Choose a name your team will recognize."
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-hub-rejected/30 bg-hub-rejected/10 px-3.5 py-2.5 text-sm text-hub-rejected">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="rename-project-name"
            className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-espresso/50"
          >
            Project name
          </label>
          <input
            id="rename-project-name"
            name="name"
            required
            disabled={isPending}
            defaultValue={currentName}
            className={cn(fieldClassName, "min-h-10")}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-10 flex-1 rounded-lg border-hub-espresso/15",
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              buttonVariants(),
              "min-h-10 flex-1 rounded-lg bg-hub-espresso text-hub-paper hover:bg-hub-espresso/90",
            )}
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </HubDialog>
  );
}
