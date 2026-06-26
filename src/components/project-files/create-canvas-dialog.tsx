"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { createCanvasAction } from "@/lib/project-files/actions";
import { canvasPath } from "@/lib/routes";
import {
  hubDialogCancelButtonClassName,
  hubDialogErrorClassName,
  hubDialogFieldClassName,
  hubDialogLabelClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import { cn } from "@/lib/utils";

type CreateCanvasDialogProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

export function CreateCanvasDialog({
  projectId,
  open,
  onClose,
}: CreateCanvasDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setName("");
    setError(null);
    onClose();
  }

  function handleCreate() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Canvas name is required.");
      return;
    }

    startTransition(async () => {
      const result = await createCanvasAction(projectId, trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.canvasId) {
        router.push(canvasPath(projectId, result.canvasId));
      }

      handleClose();
    });
  }

  return (
    <HubDialog
      open={open}
      onClose={handleClose}
      title="New open canvas"
      description="A freeform space to brainstorm, drop references, and sketch ideas with the team."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="canvas-name" className={hubDialogLabelClassName}>
            Canvas name
          </label>
          <input
            id="canvas-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campaign moodboard"
            autoFocus
            disabled={isPending}
            className={hubDialogFieldClassName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
        </div>

        {error && (
          <p className={hubDialogErrorClassName} role="alert">
            {error}
          </p>
        )}

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
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className={cn(hubDialogPrimaryButtonClassName, "flex-1")}
          >
            {isPending ? "Creating…" : "Create canvas"}
          </button>
        </div>
      </div>
    </HubDialog>
  );
}
