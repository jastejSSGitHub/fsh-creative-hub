"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { RenameSuccessBadge } from "@/components/ui/rename-success-badge";
import { HubTooltip } from "@/components/ui/hub-tooltip";
import { renameProjectFileAction } from "@/lib/project-files/actions";
import type { CanvasTheme } from "@/lib/canvas/presets";
import { cn } from "@/lib/utils";

const SUCCESS_VISIBLE_MS = 3000;

type CanvasInlineTitleProps = {
  projectId: string;
  canvasId: string;
  name: string;
  canRename: boolean;
  theme: CanvasTheme;
};

export function CanvasInlineTitle({
  projectId,
  canvasId,
  name,
  canRename,
  theme,
}: CanvasInlineTitleProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const saveVersionRef = useRef(0);
  const [displayName, setDisplayName] = useState(name);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const isLight = theme.mode === "light";

  const titleClassName = cn(
    "max-w-[min(60vw,20rem)] truncate font-display text-base font-extrabold tracking-tight sm:max-w-[min(50vw,28rem)] sm:text-lg",
    isLight ? "text-[#1a1a1a]" : "text-white",
  );

  useEffect(() => {
    setDisplayName(name);
    setDraft(name);
  }, [name]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  useEffect(() => {
    if (!showSuccess) return;

    const timer = window.setTimeout(() => setShowSuccess(false), SUCCESS_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  function startEditing() {
    if (!canRename) return;
    setError(null);
    setDraft(displayName);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(displayName);
    setError(null);
    setIsEditing(false);
  }

  function save() {
    const trimmed = draft.trim();

    if (!trimmed) {
      setError("Canvas name is required.");
      return;
    }

    if (trimmed === displayName) {
      cancelEditing();
      return;
    }

    const previousName = displayName;
    const saveVersion = ++saveVersionRef.current;

    setDisplayName(trimmed);
    setDraft(trimmed);
    setIsEditing(false);
    setError(null);
    setShowSuccess(true);

    void renameProjectFileAction({
      projectId,
      fileId: canvasId,
      fileType: "canvas",
      name: trimmed,
    }).then((result) => {
      if (saveVersion !== saveVersionRef.current) {
        if (result.ok) router.refresh();
        return;
      }

      if (!result.ok) {
        setShowSuccess(false);
        setDisplayName(previousName);
        setDraft(previousName);
        setError(result.error);
        setIsEditing(true);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {isEditing ? (
        <div className="min-w-0">
          <label className="inline-grid max-w-full">
            <span
              className={cn(
                titleClassName,
                "invisible col-start-1 row-start-1 whitespace-pre px-2 py-0.5",
              )}
              aria-hidden
            >
              {draft || "Canvas name"}
            </span>
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => save()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  save();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelEditing();
                }
              }}
              className={cn(
                titleClassName,
                "col-start-1 row-start-1 min-w-0 rounded-md border px-2 py-0.5 outline-none ring-2 transition-shadow",
                isLight
                  ? "border-[#1a1a1a]/15 bg-white/90 ring-[#18a0fb]/35 focus:border-[#18a0fb]/40"
                  : "border-white/20 bg-white/10 text-white ring-[#18a0fb]/45 focus:border-[#18a0fb]/50",
              )}
              aria-label="Canvas name"
              aria-invalid={Boolean(error)}
            />
          </label>
          {error ? (
            <p
              className={cn(
                "mt-1 max-w-[min(60vw,20rem)] text-xs",
                isLight ? "text-[#ef4444]" : "text-[#fca5a5]",
              )}
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : canRename ? (
        <HubTooltip label="Double-click to rename" side="bottom">
          <h1
            onDoubleClick={startEditing}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                startEditing();
              }
            }}
            className={cn(
              titleClassName,
              "cursor-text rounded-md px-2 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18a0fb]/35",
              isLight
                ? "hover:bg-black/[0.06]"
                : "hover:bg-white/10",
            )}
          >
            {displayName}
          </h1>
        </HubTooltip>
      ) : (
        <h1 className={titleClassName}>{displayName}</h1>
      )}

      <RenameSuccessBadge
        visible={showSuccess}
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 shadow-[0_4px_16px_rgba(34,197,94,0.28)]",
          isLight
            ? "border-hub-approved bg-hub-approved/15 text-hub-approved"
            : "border-[#4ade80] bg-[#22c55e]/20 text-[#4ade80]",
        )}
      />
    </div>
  );
}
