"use client";

import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

import { OpenCanvasWorkspace } from "@/components/canvas/open-canvas-workspace";
import { getInitiativeIdeasCanvasAction } from "@/lib/workspace/actions";
import type { ProjectCardData } from "@/lib/projects/queries";
import type { HubProject, HubProjectFile, HubRole } from "@/types/database";

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
}: IdeasCanvasBoardProps) {
  const [canvas, setCanvas] = useState<HubProjectFile | null>(initialCanvas);
  const [loading, setLoading] = useState(!initialCanvas);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hub-final/20 text-hub-foreground sm:size-10">
            <Lightbulb className="size-4 sm:size-5" aria-hidden />
          </div>
          <p className="font-display text-base font-bold text-hub-foreground sm:text-lg">
            Ideas board
          </p>
        </div>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-hub-foreground/55 sm:text-sm">
          Brainstorm on the whiteboard — drag stickies, add stickers, zoom, and undo like Open Canvas.
        </p>
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
        ) : null}
      </div>
    </div>
  );
}
