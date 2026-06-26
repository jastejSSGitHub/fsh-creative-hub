import {
  REACTION_META,
  totalVotes,
  type ConsensusCounts,
} from "@/lib/assets/consensus";
import type { VoteReaction } from "@/types/database";
import { cn } from "@/lib/utils";

type ConsensusBarProps = {
  counts: ConsensusCounts;
  size?: "sm" | "md";
  className?: string;
};

export function ConsensusBar({
  counts,
  size = "md",
  className,
}: ConsensusBarProps) {
  const total = totalVotes(counts);
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  if (total === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-full bg-hub-foreground/10",
          height,
          className,
        )}
        aria-hidden
      />
    );
  }

  const segments = (Object.keys(REACTION_META) as VoteReaction[])
    .filter((key) => counts[key] > 0)
    .map((key) => ({
      key,
      width: (counts[key] / total) * 100,
      color: REACTION_META[key].color,
    }));

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn("flex w-full overflow-hidden rounded-full", height)}
        role="img"
        aria-label={`${total} reactions`}
      >
        {segments.map((seg) => (
          <span
            key={seg.key}
            style={{ width: `${seg.width}%`, backgroundColor: seg.color }}
            className="h-full"
          />
        ))}
      </div>
      {size === "md" && (
        <p className="font-mono text-[0.6rem] uppercase tracking-wider text-hub-foreground/45">
          {total} reaction{total === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
