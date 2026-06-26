import type { VoteReaction } from "@/types/database";

export type ConsensusCounts = Record<VoteReaction, number>;

export const REACTION_META: Record<
  VoteReaction,
  { emoji: string; label: string; color: string }
> = {
  fire: { emoji: "🔥", label: "Fire", color: "#f97316" },
  up: { emoji: "👍", label: "Works", color: "#22c55e" },
  hmm: { emoji: "🤔", label: "Hmm", color: "#f59e0b" },
  no: { emoji: "❌", label: "No", color: "#ef4444" },
};

export const EMPTY_CONSENSUS: ConsensusCounts = {
  fire: 0,
  up: 0,
  hmm: 0,
  no: 0,
};

export function buildConsensusCounts(
  reactions: VoteReaction[],
): ConsensusCounts {
  return reactions.reduce<ConsensusCounts>(
    (acc, reaction) => {
      acc[reaction] += 1;
      return acc;
    },
    { ...EMPTY_CONSENSUS },
  );
}

export function totalVotes(counts: ConsensusCounts): number {
  return counts.fire + counts.up + counts.hmm + counts.no;
}
