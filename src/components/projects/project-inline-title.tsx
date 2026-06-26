"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { renameProjectAction } from "@/lib/projects/actions";
import { HubTooltip } from "@/components/ui/hub-tooltip";
import { cn } from "@/lib/utils";

type ProjectInlineTitleProps = {
  projectId: string;
  name: string;
  canRename: boolean;
  variant?: "page" | "header";
};

const titleVariants = {
  page: "font-display text-2xl font-extrabold tracking-tight break-words text-hub-espresso sm:text-3xl lg:text-4xl",
  header:
    "font-display text-lg font-extrabold tracking-tight break-words text-hub-espresso sm:text-xl",
} as const;

const TOAST_DURATION_MS = 3000;

export function ProjectInlineTitle({
  projectId,
  name,
  canRename,
  variant = "page",
}: ProjectInlineTitleProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const saveVersionRef = useRef(0);
  const [displayName, setDisplayName] = useState(name);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const titleClassName = titleVariants[variant];
  const isHeaderVariant = variant === "header";

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
    if (!showToast) return;

    const timer = window.setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [showToast]);

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
      setError("Project name is required.");
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
    setShowToast(true);

    void renameProjectAction(projectId, trimmed).then((result) => {
      if (saveVersion !== saveVersionRef.current) {
        if (result.ok) router.refresh();
        return;
      }

      if (!result.ok) {
        setShowToast(false);
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
    <>
      {isEditing ? (
        <div className={cn("min-w-0", isHeaderVariant && "mx-auto w-fit")}>
          <label className="inline-grid max-w-full">
            <span
              className={cn(
                titleClassName,
                "invisible col-start-1 row-start-1 whitespace-pre px-2.5 py-1",
                isHeaderVariant && "text-center",
              )}
              aria-hidden
            >
              {draft || "Project name"}
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
                "col-start-1 row-start-1 min-w-0 rounded-md border border-hub-espresso/15 bg-white px-2.5 py-1 shadow-[0_0_0_3px_rgba(24,160,251,0.12)] outline-none ring-2 ring-[#18a0fb]/35 transition-shadow focus:border-[#18a0fb]/40 focus:ring-[#18a0fb]/45",
                isHeaderVariant && "text-center",
              )}
              aria-label="Project name"
              aria-invalid={Boolean(error)}
            />
          </label>
          {error && (
            <p
              className={cn(
                "mt-1.5 text-sm text-hub-rejected",
                isHeaderVariant && "text-center",
              )}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      ) : canRename ? (
        <HubTooltip
          label="Double-click to rename"
          className={cn("w-fit", variant === "page" && "max-w-full")}
        >
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
              "inline-block w-fit cursor-text rounded-md px-3 py-1 transition-colors hover:bg-[#18a0fb]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18a0fb]/35",
              variant === "header" && "-mx-1 text-center",
              variant === "page" &&
                "max-w-full -mx-3 hover:bg-hub-espresso/[0.04]",
            )}
          >
            {displayName}
          </h1>
        </HubTooltip>
      ) : (
        <h1
          className={cn(
            titleClassName,
            variant === "header" && "text-center",
          )}
        >
          {displayName}
        </h1>
      )}

      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-hub-approved/30 bg-hub-approved/15 px-4 py-2 text-sm font-medium text-hub-espresso shadow-lg backdrop-blur-sm"
        >
          Changed name
        </div>
      )}
    </>
  );
}
