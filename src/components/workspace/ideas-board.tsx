"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { canEdit } from "@/lib/permissions";
import { addIdeaAction, toggleIdeaVoteAction } from "@/lib/workspace/actions";
import type { IdeaWithMeta } from "@/lib/workspace/queries";
import type { HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

const IDEA_COLORS: Record<string, string> = {
  yellow: "bg-amber-100 border-amber-200",
  pink: "bg-pink-100 border-pink-200",
  blue: "bg-sky-100 border-sky-200",
  green: "bg-emerald-100 border-emerald-200",
  lavender: "bg-violet-100 border-violet-200",
};

type IdeasBoardProps = {
  ideas: IdeaWithMeta[];
  initiativeId: string;
  projectId: string;
  role: HubRole;
};

export function IdeasBoard({
  ideas,
  initiativeId,
  projectId,
  role,
}: IdeasBoardProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitIdea() {
    startTransition(async () => {
      const result = await addIdeaAction(initiativeId, projectId, body);
      if (result.ok) {
        setBody("");
        router.refresh();
      }
    });
  }

  function toggleVote(ideaId: string) {
    startTransition(async () => {
      await toggleIdeaVoteAction(ideaId, projectId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {canEdit(role) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add an idea…"
            className="min-h-10 flex-1 rounded-md border border-hub-espresso/15 bg-white px-3.5 text-hub-espresso outline-none focus:ring-2 focus:ring-hub-accent/40"
          />
          <button
            type="button"
            disabled={isPending || !body.trim()}
            onClick={submitIdea}
            className={cn(buttonVariants(), "min-h-10 rounded-md bg-hub-espresso px-5 text-hub-paper")}
          >
            Add idea
          </button>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hub-espresso/15 px-6 py-12 text-center">
          <p className="font-display text-lg font-bold text-hub-espresso">No ideas yet</p>
          <p className="mt-2 text-sm text-hub-espresso/55">
            Brainstorm directions before assets land in the grid.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <li
              key={idea.id}
              className={cn(
                "flex flex-col justify-between rounded-xl border p-4 shadow-sm",
                IDEA_COLORS[idea.color] ?? IDEA_COLORS.yellow,
              )}
            >
              <p className="text-sm leading-relaxed text-hub-espresso">{idea.body}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-hub-espresso/55">{idea.author.display_name}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleVote(idea.id)}
                  className={cn(
                    "min-h-9 rounded-md border px-3 text-xs font-medium",
                    idea.user_voted
                      ? "border-hub-espresso bg-hub-espresso text-white"
                      : "border-hub-espresso/20 bg-white/80 text-hub-espresso",
                  )}
                >
                  ▲ {idea.vote_count}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
