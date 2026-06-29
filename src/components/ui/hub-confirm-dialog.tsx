"use client";

import type { ReactNode } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import {
  hubDialogCancelButtonClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import { cn } from "@/lib/utils";

type HubConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onClose: () => void;
  onConfirm: () => void;
};

export function HubConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onClose,
  onConfirm,
}: HubConfirmDialogProps) {
  return (
    <HubDialog open={open} onClose={onClose} title={title} className="w-[min(100vw-2rem,24rem)]">
      <div className="text-[0.8125rem] leading-relaxed text-hub-foreground/80">{description}</div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={hubDialogCancelButtonClassName}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            hubDialogPrimaryButtonClassName,
            tone === "danger" && "bg-hub-rejected hover:bg-hub-rejected/90",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </HubDialog>
  );
}
