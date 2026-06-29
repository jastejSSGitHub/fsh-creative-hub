"use client";

import { useEffect, useState } from "react";

import {
  QUICK_ADD_PENDING_STAGE_MS,
  pickQuickAddPendingMessage,
} from "@/lib/tasks/quick-add/quick-add-pending-messages";
import { cn } from "@/lib/utils";

type QuickAddPendingStateProps = {
  taskName: string;
};

export function QuickAddPendingState({ taskName }: QuickAddPendingStateProps) {
  const [message, setMessage] = useState(() => pickQuickAddPendingMessage());
  const [messageVisible, setMessageVisible] = useState(true);

  useEffect(() => {
    const rotateTimer = window.setInterval(() => {
      setMessageVisible(false);
      window.setTimeout(() => {
        setMessage((current) => pickQuickAddPendingMessage(current));
        setMessageVisible(true);
      }, 160);
    }, QUICK_ADD_PENDING_STAGE_MS);

    return () => window.clearInterval(rotateTimer);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95 duration-200"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Adding task: ${taskName}`}
    >
      <div className="relative mb-5 flex size-[4.5rem] items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-2 border-hub-primary/15"
          aria-hidden
        />
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-hub-primary hub-quick-add-spinner"
          aria-hidden
        />
        <span
          className="flex size-10 items-center justify-center rounded-full bg-hub-primary/10 text-hub-primary"
          aria-hidden
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-5">
            <path
              d="M10 4.5v11M4.5 10h11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>

      <p className="font-display text-lg font-semibold tracking-tight text-hub-foreground">
        Adding your task
      </p>

      <div className="mt-2 h-6 max-w-[22rem] overflow-hidden px-2">
        <p
          className={cn(
            "text-sm text-hub-foreground/70 transition-all duration-200",
            messageVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-0",
          )}
        >
          {message}
        </p>
      </div>

      <p className="mt-2 max-w-[22rem] truncate text-xs text-hub-foreground/45">
        &ldquo;{taskName}&rdquo; — hang tight, the software&apos;s on it.
      </p>

      <div
        className="relative mt-5 h-1 w-28 overflow-hidden rounded-full bg-hub-foreground/10"
        aria-hidden
      >
        <div className="hub-quick-add-progress absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-hub-primary/30 via-hub-primary to-hub-primary/30" />
      </div>
    </div>
  );
}
