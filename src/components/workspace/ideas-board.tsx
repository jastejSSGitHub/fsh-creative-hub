"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";

import { MemberAvatar } from "@/components/projects/member-avatar";
import { buttonVariants } from "@/components/ui/button";
import { canEdit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { addIdeaAction, toggleIdeaVoteAction } from "@/lib/workspace/actions";
import { getIdeasForInitiative, type IdeaWithMeta } from "@/lib/workspace/queries";
import type { HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

const IDEA_COLORS: Record<string, { bg: string; rotate: string }> = {
  yellow: { bg: "bg-amber-50 border-amber-200/80", rotate: "-rotate-1" },
  pink: { bg: "bg-pink-50 border-pink-200/80", rotate: "rotate-1" },
  blue: { bg: "bg-sky-50 border-sky-200/80", rotate: "-rotate-[0.5deg]" },
  green: { bg: "bg-emerald-50 border-emerald-200/80", rotate: "rotate-[0.5deg]" },
  lavender: { bg: "bg-violet-50 border-violet-200/80", rotate: "-rotate-1" },
};

type IdeasBoardProps = {
  ideas: IdeaWithMeta[];
  initiativeId: string;
  projectId: string;
  role: HubRole;
  userId: string;
};

export function IdeasBoard({
  ideas: initialIdeas,
  initiativeId,
  projectId,
  role,
  userId,
}: IdeasBoardProps) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIdeas(initialIdeas);
  }, [initialIdeas]);

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

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-hub-foreground/10 bg-hub-surface px-4 py-4 shadow-sm sm:px-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-hub-final/20 text-hub-foreground">
          <Lightbulb className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-display text-base font-bold text-hub-foreground sm:text-lg">
            Ideas board
          </p>
          <p className="text-xs leading-relaxed text-hub-foreground/55 sm:text-sm">
            Brainstorm directions before assets land. Everyone can upvote; editors can add ideas.
          </p>
        </div>
      </div>

      {canEdit(role) && (
        <div className="rounded-xl border border-hub-foreground/10 bg-hub-surface p-4 shadow-sm sm:p-5">
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
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea) => {
            const palette = IDEA_COLORS[idea.color] ?? IDEA_COLORS.yellow;

            return (
              <li
                key={idea.id}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md",
                  palette.bg,
                  palette.rotate,
                )}
              >
                <p className="text-sm leading-relaxed text-hub-foreground">{idea.body}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-hub-foreground/8 pt-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <MemberAvatar
                      displayName={idea.author.display_name}
                      avatarUrl={idea.author.avatar_url}
                      colorSeed={idea.author.id}
                      size="sm"
                      variant="muted"
                    />
                    <span className="truncate text-xs text-hub-foreground/60">
                      {idea.author.display_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleVote(idea.id)}
                    className={cn(
                      "inline-flex min-h-10 min-w-[3.25rem] items-center justify-center gap-1 rounded-lg border px-3 text-xs font-semibold transition-all sm:min-h-9",
                      idea.user_voted
                        ? "border-hub-foreground bg-hub-espresso text-white shadow-sm"
                        : "border-hub-foreground/15 bg-hub-surface/90 text-hub-foreground hover:border-hub-foreground/30",
                    )}
                    aria-pressed={idea.user_voted}
                  >
                    <span aria-hidden>▲</span>
                    {idea.vote_count}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
