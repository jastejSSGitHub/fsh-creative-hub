"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { buttonVariants } from "@/components/ui/button";
import { createProjectAction } from "@/lib/projects/actions";
import { PROJECTS_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-md border border-hub-espresso/15 bg-white px-3.5 text-hub-espresso outline-none ring-hub-accent/40 placeholder:text-hub-espresso/35 focus:ring-2 disabled:opacity-60";

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
          <p className="rounded-lg border border-hub-rejected/30 bg-hub-rejected/10 px-3.5 py-2.5 text-sm text-hub-rejected">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="project-name"
            className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-espresso/50"
          >
            Project name
          </label>
          <input
            id="project-name"
            name="name"
            required
            disabled={isPending}
            placeholder="Summer Campaign 2026"
            className={cn(fieldClassName, "min-h-10")}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="project-description"
            className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-espresso/50"
          >
            Description (optional)
          </label>
          <textarea
            id="project-description"
            name="description"
            rows={3}
            disabled={isPending}
            placeholder="What is this project for?"
            className={cn(fieldClassName, "resize-none py-2.5")}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="project-cover"
            className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-espresso/50"
          >
            Cover image (optional)
          </label>
          <input
            id="project-cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isPending}
            className="block w-full text-sm text-hub-espresso/70 file:mr-3 file:min-h-9 file:rounded-md file:border-0 file:bg-hub-espresso file:px-4 file:py-2 file:font-mono file:text-[0.65rem] file:uppercase file:tracking-wider file:text-white"
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
            {isPending ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </HubDialog>
  );
}
