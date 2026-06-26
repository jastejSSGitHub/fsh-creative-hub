"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { buttonVariants } from "@/components/ui/button";
import { createInitiativeAction } from "@/lib/workspace/actions";
import { cn } from "@/lib/utils";

type CreateInitiativeDialogProps = {
  projectId: string;
  reviewBoardId?: string;
  open: boolean;
  onClose: () => void;
};

export function CreateInitiativeDialog({
  projectId,
  reviewBoardId,
  open,
  onClose,
}: CreateInitiativeDialogProps) {
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
    formData.set("projectId", projectId);
    if (reviewBoardId) formData.set("reviewBoardId", reviewBoardId);

    startTransition(async () => {
      const result = await createInitiativeAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      handleClose();
      router.refresh();
    });
  }

  return (
    <HubDialog
      open={open}
      onClose={handleClose}
      title={reviewBoardId ? "New section" : "New initiative"}
      description={
        reviewBoardId
          ? "Add another section to this review board."
          : "Group assets for a campaign, menu refresh, or deliverable set."
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md border border-hub-rejected/30 bg-hub-rejected/10 px-3.5 py-2.5 text-sm text-hub-rejected">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <label
            htmlFor="initiative-name"
            className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-foreground/50"
          >
            Initiative name
          </label>
          <input
            id="initiative-name"
            name="name"
            required
            disabled={isPending}
            placeholder="Summer Campaign"
            className="min-h-9 w-full rounded-md border border-hub-foreground/15 bg-hub-surface px-3 py-2 text-sm text-hub-foreground outline-none ring-hub-accent/40 placeholder:text-sm placeholder:text-hub-foreground/35 focus:ring-2 disabled:opacity-60"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-10 flex-1 rounded-md border-hub-foreground/15",
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              buttonVariants(),
              "min-h-10 flex-1 rounded-md bg-hub-espresso text-hub-paper",
            )}
          >
            {isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </HubDialog>
  );
}
