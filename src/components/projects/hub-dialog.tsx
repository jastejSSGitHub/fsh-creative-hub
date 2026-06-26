"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type HubDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function HubDialog({
  open,
  onClose,
  title,
  description,
  headerAction,
  children,
  className,
}: HubDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !mounted) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, mounted]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    function handleBackdropClick(event: MouseEvent) {
      const el = dialogRef.current;
      if (!el) return;
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
  }, [open, onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        "fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(100vw-2rem,30rem)] overflow-visible rounded-[8px] border border-hub-foreground/10 bg-hub-paper p-0 text-hub-foreground shadow-2xl backdrop:bg-hub-foreground/50 open:flex open:flex-col",
        className,
      )}
    >
      <div className="relative flex items-center gap-2 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[0.9375rem] font-semibold leading-snug tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-hub-foreground/55">
              {description}
            </p>
          )}
        </div>
        {headerAction}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-hub-foreground/40 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground/70"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="overflow-visible px-4 pb-4">{children}</div>
    </dialog>,
    document.body,
  );
}
