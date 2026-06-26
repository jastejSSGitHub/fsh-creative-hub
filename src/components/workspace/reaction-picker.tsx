"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import {
  REACTION_META,
  buildConsensusCounts,
} from "@/lib/assets/consensus";
import { HubTooltip } from "@/components/ui/hub-tooltip";
import type { VoteReaction } from "@/types/database";
import { cn } from "@/lib/utils";

const REACTIONS = Object.keys(REACTION_META) as VoteReaction[];

type ReactionPickerProps = {
  userReaction: VoteReaction | null;
  disabled?: boolean;
  onReact: (reaction: VoteReaction) => void;
};

type BurstParticle = {
  id: number;
  reaction: VoteReaction;
  x: number;
  y: number;
};

export function ReactionPicker({
  userReaction,
  disabled,
  onReact,
}: ReactionPickerProps) {
  const [burst, setBurst] = useState<BurstParticle[]>([]);

  function triggerBurst(reaction: VoteReaction) {
    const particles: BurstParticle[] = Array.from({ length: 4 }, (_, index) => ({
      id: Date.now() + index,
      reaction,
      x: (index - 1.5) * 14 + (Math.random() * 8 - 4),
      y: -(18 + index * 10 + Math.random() * 8),
    }));
    setBurst((prev) => [...prev, ...particles]);
    window.setTimeout(() => {
      setBurst((prev) =>
        prev.filter((particle) => !particles.some((p) => p.id === particle.id)),
      );
    }, 700);
  }

  function handleClick(reaction: VoteReaction) {
    if (disabled) return;
    if (userReaction !== reaction) {
      triggerBurst(reaction);
    }
    onReact(reaction);
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {REACTIONS.map((reaction) => {
          const selected = userReaction === reaction;
          const meta = REACTION_META[reaction];

          return (
            <HubTooltip
              key={reaction}
              side="top"
              label={
                selected
                  ? `${meta.label} · tap again to remove`
                  : meta.label
              }
            >
              <div className="relative">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleClick(reaction)}
                  className={cn(
                    "relative flex min-h-11 w-full items-center justify-center rounded-md border text-xl transition-colors",
                    selected
                      ? "border-hub-espresso bg-hub-espresso/10 ring-2 ring-hub-espresso/15"
                      : "border-hub-espresso/15 bg-white hover:bg-hub-espresso/5",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                  aria-pressed={selected}
                >
                  <motion.span
                    key={`${reaction}-${selected}`}
                    initial={false}
                    animate={{ scale: selected ? 1.12 : 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  >
                    {meta.emoji}
                  </motion.span>
                  {selected && (
                    <span className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-hub-espresso" />
                  )}
                </button>
                <AnimatePresence>
                  {burst
                    .filter((particle) => particle.reaction === reaction)
                    .map((particle) => (
                      <motion.span
                        key={particle.id}
                        initial={{ opacity: 1, x: "-50%", y: 0, scale: 0.7 }}
                        animate={{
                          opacity: 0,
                          x: `calc(-50% + ${particle.x}px)`,
                          y: particle.y,
                          scale: 1.15,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                        className="pointer-events-none absolute left-1/2 top-1/2 text-lg"
                      >
                        {meta.emoji}
                      </motion.span>
                    ))}
                </AnimatePresence>
              </div>
            </HubTooltip>
          );
        })}
      </div>

      {userReaction && (
        <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-wider text-hub-espresso/45">
          Your reaction: {REACTION_META[userReaction].emoji} {REACTION_META[userReaction].label} · tap again to remove
        </p>
      )}
    </div>
  );
}

export function applyOptimisticVote(
  votes: { user_id: string; reaction: VoteReaction; id: string; asset_id: string; created_at: string }[],
  userId: string,
  assetId: string,
  reaction: VoteReaction,
) {
  const next = [...votes];
  const index = next.findIndex((vote) => vote.user_id === userId);

  if (index >= 0) {
    if (next[index].reaction === reaction) {
      next.splice(index, 1);
    } else {
      next[index] = { ...next[index], reaction };
    }
  } else {
    next.push({
      id: `optimistic-${Date.now()}`,
      asset_id: assetId,
      user_id: userId,
      reaction,
      created_at: new Date().toISOString(),
    });
  }

  return {
    votes: next,
    consensus: buildConsensusCounts(next.map((vote) => vote.reaction)),
  };
}
