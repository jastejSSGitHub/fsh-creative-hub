"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  defaultIdeaStickySize,
  IdeaStickyNote,
} from "@/components/workspace/idea-sticky-note";
import { STICKY_WIDTH } from "@/lib/canvas/presets";
import type { CanvasTextSize, StickyColorId } from "@/lib/canvas/types";
import { canEdit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import {
  addIdeaAction,
  deleteIdeaAction,
  duplicateIdeaAction,
  toggleIdeaVoteAction,
  updateIdeaBodyAction,
  updateIdeaFormatAction,
  updateIdeaSizeAction,
} from "@/lib/workspace/actions";
import { stickyColorToIdeaColor } from "@/lib/workspace/idea-sticky-colors";
import { getIdeasForInitiative, type IdeaWithMeta } from "@/lib/workspace/queries";
import type { HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

type IdeasBoardProps = {
  ideas: IdeaWithMeta[];
  initiativeId: string;
  projectId: string;
  role: HubRole;
  userId: string;
};

type StickySize = { width: number; height: number };

function computeColumnMaxWidth(containerWidth: number, columns: number, gap: number) {
  if (containerWidth <= 0 || columns <= 0) return STICKY_WIDTH;
  return Math.floor((containerWidth - gap * (columns - 1)) / columns);
}

export function IdeasBoard({
  ideas: initialIdeas,
  initiativeId,
  projectId,
  role,
  userId,
}: IdeasBoardProps) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [body, setBody] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sizeOverrides, setSizeOverrides] = useState<Record<string, StickySize>>({});
  const [columnMaxWidth, setColumnMaxWidth] = useState(STICKY_WIDTH);
  const [isPending, startTransition] = useTransition();
  const gridRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setIdeas(initialIdeas);
  }, [initialIdeas]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const gap = 16;

    function syncColumnWidth() {
      const columns = window.matchMedia("(min-width: 640px)").matches ? 2 : 1;
      setColumnMaxWidth(computeColumnMaxWidth(grid!.clientWidth, columns, gap));
    }

    syncColumnWidth();

    const observer = new ResizeObserver(syncColumnWidth);
    observer.observe(grid);

    const media = window.matchMedia("(min-width: 640px)");
    media.addEventListener("change", syncColumnWidth);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncColumnWidth);
    };
  }, [ideas.length]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("[data-idea-sticky]")) return;
      if (target.closest("[data-sticky-toolbar]")) return;
      if (target.closest("[data-sticky-toolbar-popover]")) return;
      setSelectedId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const refreshIdeas = useCallback(async () => {
    const supabase = createClient();
    const data = await getIdeasForInitiative(supabase, initiativeId, userId);
    setIdeas(data);
  }, [initiativeId, userId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ideas-${initiativeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hub_ideas",
          filter: `initiative_id=eq.${initiativeId}`,
        },
        () => {
          void refreshIdeas();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hub_idea_votes" },
        () => {
          void refreshIdeas();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initiativeId, refreshIdeas]);

  function getStickySize(idea: IdeaWithMeta): StickySize {
    return sizeOverrides[idea.id] ?? defaultIdeaStickySize(idea);
  }

  function setStickySize(ideaId: string, size: StickySize) {
    setSizeOverrides((current) => ({ ...current, [ideaId]: size }));
    setIdeas((current) =>
      current.map((idea) =>
        idea.id === ideaId ? { ...idea, width: size.width, height: size.height } : idea,
      ),
    );
  }

  function patchIdea(ideaId: string, patch: Partial<IdeaWithMeta>) {
    setIdeas((current) =>
      current.map((idea) => (idea.id === ideaId ? { ...idea, ...patch } : idea)),
    );
  }

  function submitIdea() {
    startTransition(async () => {
      const result = await addIdeaAction(initiativeId, projectId, body);
      if (result.ok) {
        setBody("");
        await refreshIdeas();
      }
    });
  }

  function toggleVote(ideaId: string) {
    startTransition(async () => {
      await toggleIdeaVoteAction(ideaId, projectId);
      await refreshIdeas();
    });
  }

  function persistStickySize(ideaId: string, size: StickySize) {
    startTransition(async () => {
      const result = await updateIdeaSizeAction(ideaId, projectId, size.width, size.height);
      if (result.ok) {
        setSizeOverrides((current) => {
          const next = { ...current };
          delete next[ideaId];
          return next;
        });
      } else {
        await refreshIdeas();
      }
    });
  }

  function updateBody(ideaId: string, nextBody: string) {
    patchIdea(ideaId, { body: nextBody });
    startTransition(async () => {
      const result = await updateIdeaBodyAction(ideaId, projectId, nextBody);
      if (!result.ok) await refreshIdeas();
    });
  }

  function updateFormat(
    ideaId: string,
    patch: {
      color?: StickyColorId;
      textSize?: CanvasTextSize;
      bold?: boolean;
      strikethrough?: boolean;
    },
  ) {
    const dbPatch: Partial<IdeaWithMeta> = {};
    if (patch.color !== undefined) {
      dbPatch.color = stickyColorToIdeaColor(patch.color);
    }
    if (patch.textSize !== undefined) dbPatch.text_size = patch.textSize;
    if (patch.bold !== undefined) dbPatch.bold = patch.bold;
    if (patch.strikethrough !== undefined) dbPatch.strikethrough = patch.strikethrough;

    patchIdea(ideaId, dbPatch);

    startTransition(async () => {
      const result = await updateIdeaFormatAction(ideaId, projectId, patch);
      if (!result.ok) await refreshIdeas();
    });
  }

  const deleteIdea = useCallback(
    (ideaId: string) => {
      setSelectedId(null);
      setIdeas((current) => current.filter((idea) => idea.id !== ideaId));
      startTransition(async () => {
        const result = await deleteIdeaAction(ideaId, projectId);
        if (!result.ok) await refreshIdeas();
      });
    },
    [projectId, refreshIdeas],
  );

  const duplicateIdea = useCallback(
    (ideaId: string) => {
      startTransition(async () => {
        const result = await duplicateIdeaAction(ideaId, projectId, initiativeId);
        if (result.ok) {
          await refreshIdeas();
          if (result.id) setSelectedId(result.id);
        }
      });
    },
    [initiativeId, projectId, refreshIdeas],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!selectedId) return;

      const selected = ideas.find((idea) => idea.id === selectedId);
      if (!selected || selected.author_id !== userId) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "c") {
        event.preventDefault();
        void navigator.clipboard.writeText(selected.body);
        return;
      }

      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateIdea(selected.id);
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteIdea(selected.id);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteIdea, duplicateIdea, ideas, selectedId, userId]);

  return (
    <div className="space-y-5">
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
          Brainstorm directions before assets land. Everyone can upvote; editors can add ideas.
        </p>
      </div>

      {canEdit(role) && (
        <div className="rounded-lg border border-hub-foreground/10 bg-hub-surface p-4 shadow-sm sm:p-5">
          <label className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-hub-foreground/45">
            New idea
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What direction should we explore?"
            rows={3}
            className="mt-2 min-h-[5.5rem] w-full resize-none rounded-lg border border-hub-foreground/12 bg-hub-paper/40 px-3.5 py-3 text-sm text-hub-foreground outline-none transition-colors placeholder:text-hub-foreground/35 focus:border-hub-foreground/25 focus:ring-2 focus:ring-hub-accent/30"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={isPending || !body.trim()}
              onClick={submitIdea}
              className={cn(
                buttonVariants(),
                "min-h-11 gap-2 rounded-lg bg-hub-espresso px-5 text-hub-paper sm:min-h-10",
              )}
            >
              <Sparkles className="size-4" aria-hidden />
              Add idea
            </button>
          </div>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hub-foreground/15 bg-hub-surface/70 px-6 py-14 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-hub-final/15">
            <Lightbulb className="size-6 text-hub-foreground/50" aria-hidden />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-hub-foreground">No ideas yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-hub-foreground/55">
            {canEdit(role)
              ? "Drop the first sticky — the team can upvote and shape direction together."
              : "Editors will add ideas here. You can upvote when they appear."}
          </p>
        </div>
      ) : (
        <ul ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ideas.map((idea) => {
            const size = getStickySize(idea);
            const canMutate = idea.author_id === userId;

            return (
              <li key={idea.id} data-idea-sticky className="flex items-start">
                <IdeaStickyNote
                  idea={idea}
                  width={size.width}
                  height={size.height}
                  maxWidth={columnMaxWidth}
                  selected={selectedId === idea.id}
                  canMutate={canMutate}
                  isPending={isPending}
                  onSelect={() => setSelectedId(idea.id)}
                  onResize={(next) => setStickySize(idea.id, next)}
                  onResizeEnd={(next) => persistStickySize(idea.id, next)}
                  onBodyChange={(nextBody) => updateBody(idea.id, nextBody)}
                  onFormatChange={(patch) => updateFormat(idea.id, patch)}
                  onDuplicate={() => duplicateIdea(idea.id)}
                  onDelete={() => deleteIdea(idea.id)}
                  onToggleVote={() => toggleVote(idea.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
