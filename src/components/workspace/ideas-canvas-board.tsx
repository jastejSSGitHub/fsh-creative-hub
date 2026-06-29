"use client";

import { Images, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { OpenCanvasWorkspace } from "@/components/canvas/open-canvas-workspace";
import { buttonVariants } from "@/components/ui/button";
import { canEdit } from "@/lib/permissions";
import { taskDeepLinkPath } from "@/lib/routes";
import { createTaskFromStickyAction, getInitiativeIdeasCanvasAction } from "@/lib/workspace/actions";
import { IdeasCanvasBridgeProvider } from "@/lib/workspace/ideas-canvas-bridge";
import type { ProjectCardData } from "@/lib/projects/queries";
import type { HubProject, HubProjectFile, HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

type IdeasCanvasBoardProps = {
  project: HubProject;
  initiativeId: string;
  initiativeName: string;
  initialCanvas: HubProjectFile | null;
  authorName: string;
  projectCard: ProjectCardData;
  currentUserId: string;
  role: HubRole;
  onStickyCountChange?: (count: number) => void;
  onViewAssets?: () => void;
};

export function IdeasCanvasBoard({
  project,
  initiativeId,
  initiativeName,
  initialCanvas,
  authorName,
  projectCard,
  currentUserId,
  role,
  onStickyCountChange,
  onViewAssets,
}: IdeasCanvasBoardProps) {
  const router = useRouter();
  const [canvas, setCanvas] = useState<HubProjectFile | null>(initialCanvas);
  const [loading, setLoading] = useState(!initialCanvas);
  const [error, setError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskPending, startTaskTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadCanvas() {
      setLoading(true);
      setError(null);

      const result = await getInitiativeIdeasCanvasAction(
        project.id,
        initiativeId,
        initiativeName,
      );

      if (cancelled) return;

      if (result.ok) {
        setCanvas(result.canvas);
      } else {
        setError(result.error ?? "Could not load ideas whiteboard.");
      }

      setLoading(false);
    }

    void loadCanvas();

    return () => {
      cancelled = true;
    };
  }, [initiativeId, initiativeName, project.id]);

  function handleCreateTaskFromSticky(text: string) {
    setTaskError(null);
    startTaskTransition(async () => {
      const result = await createTaskFromStickyAction({
        projectId: project.id,
        initiativeId,
        body: text,
      });
      if (!result.ok) {
        setTaskError(result.error);
        return;
      }
      if (result.id) {
        router.push(taskDeepLinkPath(result.id, project.id));
      }
    });
  }

  const bridgeValue = {
    initiativeId,
    projectId: project.id,
    onViewAssets,
    onCreateTaskFromSticky: canEdit(role) ? handleCreateTaskFromSticky : undefined,
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hub-final/20 text-hub-foreground sm:size-10">
            <Lightbulb className="size-4 sm:size-5" aria-hidden />
          </div>
          <p className="font-display text-base font-bold text-hub-foreground sm:text-lg">
            Ideas board
          </p>
          {onViewAssets ? (
            <button
              type="button"
              onClick={onViewAssets}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "ml-0 h-8 rounded-md sm:ml-2",
              )}
            >
              <Images className="size-3.5" aria-hidden />
              View assets
            </button>
          ) : null}
        </div>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-hub-foreground/55 sm:text-sm">
          Brainstorm on the whiteboard — drag stickies, add stickers, zoom, and undo like Open Canvas.
          {canEdit(role) ? " Use the task icon on a sticky to turn it into work." : null}
        </p>
        {taskError ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {taskError}
          </p>
        ) : null}
        {taskPending ? (
          <p className="mt-2 text-xs text-hub-foreground/50">Creating task…</p>
        ) : null}
      </div>

      <div className="w-full min-w-0">
        {loading ? (
          <div className="flex min-h-[min(480px,70dvh)] items-center justify-center rounded-xl border border-hub-foreground/10 bg-hub-surface/80">
            <p className="text-sm text-hub-foreground/55">Loading whiteboard…</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[min(480px,70dvh)] items-center justify-center rounded-xl border border-dashed border-hub-foreground/15 bg-hub-surface/70 px-6 text-center">
            <p className="text-sm text-hub-foreground/60">{error}</p>
          </div>
        ) : canvas ? (
          <IdeasCanvasBridgeProvider value={bridgeValue}>
            <OpenCanvasWorkspace
              variant="embedded"
              project={project}
              canvas={canvas}
              authorName={authorName}
              projectCard={projectCard}
              currentUserId={currentUserId}
              canRename={role === "admin" || role === "editor"}
              onStickyCountChange={onStickyCountChange}
            />
          </IdeasCanvasBridgeProvider>
        ) : null}
      </div>
    </div>
  );
}
