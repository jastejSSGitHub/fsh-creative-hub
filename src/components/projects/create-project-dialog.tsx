"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { createProjectAction } from "@/lib/projects/actions";
import { PROJECTS_PATH } from "@/lib/routes";
import {
  hubDialogCancelButtonClassName,
  hubDialogErrorClassName,
  hubDialogFieldClassName,
  hubDialogLabelClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import { cn } from "@/lib/utils";

type CreateProjectDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const router = useRouter();
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
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createProjectAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      handleClose();
      router.refresh();

      if (result.projectId) {
        router.push(`${PROJECTS_PATH}/${result.projectId}`);
      }
    });
  }

  return (
    <HubDialog
      open={open}
      onClose={handleClose}
      title="New project"
      description="Start a workspace for a client, campaign, or internal initiative."
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className={hubDialogErrorClassName}>
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="project-name" className={hubDialogLabelClassName}>
            Project name
          </label>
          <input
            id="project-name"
            name="name"
            required
            disabled={isPending}
            placeholder="Summer Campaign 2026"
            className={hubDialogFieldClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="project-description" className={hubDialogLabelClassName}>
            Description (optional)
          </label>
          <textarea
            id="project-description"
            name="description"
            rows={3}
            disabled={isPending}
            placeholder="What is this project for?"
            className={cn(hubDialogFieldClassName, "resize-none py-2")}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="project-cover" className={hubDialogLabelClassName}>
            Cover image (optional)
          </label>
          <input
            id="project-cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isPending}
            className="block w-full text-[0.8125rem] text-hub-foreground/55 file:mr-3 file:min-h-8 file:rounded-[6px] file:border file:border-hub-foreground/12 file:bg-hub-surface file:px-3 file:py-1.5 file:text-[0.8125rem] file:font-medium file:text-hub-foreground file:transition-colors hover:file:bg-hub-foreground/[0.03]"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className={cn(hubDialogCancelButtonClassName, "flex-1")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={cn(hubDialogPrimaryButtonClassName, "flex-1")}
          >
            {isPending ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </HubDialog>
  );
}
