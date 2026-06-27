"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { createTextDocumentAction } from "@/lib/project-files/actions";
import {
  defaultDocumentCover,
  defaultDocumentIcon,
  rememberDocumentPreferences,
} from "@/lib/documents/defaults";
import { captureTextDocumentNavigationSnapshot } from "@/lib/projects/text-document-snapshot";
import { textDocumentPath } from "@/lib/routes";
import {
  hubDialogCancelButtonClassName,
  hubDialogErrorClassName,
  hubDialogFieldClassName,
  hubDialogLabelClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import { cn } from "@/lib/utils";

type CreateTextDocumentDialogProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

export function CreateTextDocumentDialog({
  projectId,
  open,
  onClose,
}: CreateTextDocumentDialogProps) {
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
      setError("Document name is required.");
      return;
    }

    startTransition(async () => {
      const result = await createTextDocumentAction(projectId, trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.docId) {
        const cover = defaultDocumentCover(trimmed);
        const icon = defaultDocumentIcon();
        rememberDocumentPreferences(projectId, result.docId, { cover, icon });
        captureTextDocumentNavigationSnapshot({
          projectId,
          docId: result.docId,
          docName: trimmed,
          icon,
          cover,
        });
        router.push(textDocumentPath(projectId, result.docId));
      }

      handleClose();
    });
  }

  return (
    <HubDialog
      open={open}
      onClose={handleClose}
      title="New text document"
      description="A rich wiki page for project briefs, notes, and long-form context your team can edit together."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="doc-name" className={hubDialogLabelClassName}>
            Document name
          </label>
          <input
            id="doc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campaign brief"
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
            {isPending ? "Creating…" : "Create document"}
          </button>
        </div>
      </div>
    </HubDialog>
  );
}
