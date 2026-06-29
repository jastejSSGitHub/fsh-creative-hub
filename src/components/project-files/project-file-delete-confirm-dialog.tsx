"use client";

import { HubConfirmDialog } from "@/components/ui/hub-confirm-dialog";

type ProjectFileDeleteConfirmDialogProps = {
  open: boolean;
  fileName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ProjectFileDeleteConfirmDialog({
  open,
  fileName,
  onClose,
  onConfirm,
}: ProjectFileDeleteConfirmDialogProps) {
  return (
    <HubConfirmDialog
      open={open}
      title="Delete file"
      description={
        <>
          Are you sure you want to delete
          {fileName ? (
            <>
              {" "}
              <span className="font-medium text-hub-foreground">{fileName}</span>
            </>
          ) : (
            " this file"
          )}
          ?
        </>
      }
      confirmLabel="Delete"
      tone="danger"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
