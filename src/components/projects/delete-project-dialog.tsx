"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { deleteProjectAction } from "@/lib/projects/actions";
import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-md border border-hub-foreground/15 bg-hub-surface px-3.5 text-hub-foreground outline-none ring-hub-rejected/30 placeholder:text-hub-foreground/35 focus:ring-2 disabled:opacity-60";

type DeleteProjectDialogProps = {
  open: boolean;
  projectId: string | null;
  projectName: string;
  onClose: () => void;
  onDeleted?: () => void;
};

export function DeleteProjectDialog({
  open,
  projectId,
  projectName,
  onClose,
  onDeleted,
}: DeleteProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nameMatches = confirmName === projectName;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !mounted) return;

    if (open && !dialog.open) {
      dialog.showModal();
      setConfirmName("");
      setError(null);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, mounted]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    function handleBackdropClick(event: MouseEvent) {
      const el = dialogRef.current;
      if (!el || isPending) return;
      const rect = el.getBoundingClientRect();
      const clickedInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!clickedInside) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleBackdropClick);
    return () => document.removeEventListener("mousedown", handleBackdropClick);
  }, [open, onClose, isPending]);

  function handleClose() {
    if (isPending) return;
    setConfirmName("");
    setError(null);
    onClose();
  }

  function handleDelete() {
    if (!projectId || !nameMatches) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteProjectAction(projectId, confirmName);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      handleClose();
      onDeleted?.();
    });
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(100vw-2rem,28rem)] overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-paper p-0 text-hub-foreground shadow-2xl backdrop:bg-hub-foreground/50 open:flex open:flex-col"
    >
      <div className="flex items-start gap-3 border-b border-hub-foreground/10 px-5 py-4">
        <h2 className="min-w-0 flex-1 text-[0.9375rem] font-semibold leading-snug tracking-tight">
          Confirm deletion of {projectName}
        </h2>
        <button
          type="button"
          onClick={handleClose}
          disabled={isPending}
          aria-label="Close"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-hub-foreground/40 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground/70 disabled:opacity-50"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-start gap-3 bg-hub-rejected/10 px-5 py-3.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-hub-rejected/15">
          <AlertTriangle className="size-4 text-hub-rejected" aria-hidden />
        </div>
        <p className="pt-1 text-sm font-semibold text-hub-foreground">
          This action cannot be undone.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        {error && (
          <p className="rounded-lg border border-hub-rejected/30 bg-hub-rejected/10 px-3.5 py-2.5 text-sm text-hub-rejected">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm text-hub-foreground/60">
            Type <span className="font-semibold text-hub-foreground">{projectName}</span>{" "}
            to confirm.
          </p>
          <input
            ref={inputRef}
            type="text"
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            disabled={isPending}
            placeholder="Type the project name in here"
            autoComplete="off"
            spellCheck={false}
            className={cn(fieldClassName, "min-h-10")}
          />
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={!nameMatches || isPending}
          className={cn(
            buttonVariants(),
            "min-h-11 w-full rounded-lg text-sm font-medium transition-colors",
            nameMatches && !isPending
              ? "bg-hub-rejected text-white hover:bg-hub-rejected/90"
              : "cursor-not-allowed bg-hub-rejected/35 text-white/50",
          )}
        >
          {isPending ? "Deleting…" : "I understand, delete this project"}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
