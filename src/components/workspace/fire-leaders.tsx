"use client";

import type { AssetWithVotes } from "@/lib/workspace/queries";
import { AssetMediaPreview } from "@/components/workspace/asset-media-preview";
import { cn } from "@/lib/utils";

type FireLeadersProps = {
  assets: AssetWithVotes[];
  onOpen: (assetId: string) => void;
  className?: string;
};

export function FireLeaders({ assets, onOpen, className }: FireLeadersProps) {
  const leaders = [...assets]
    .filter((asset) => asset.consensus.fire > 0)
    .sort((a, b) => b.consensus.fire - a.consensus.fire)
    .slice(0, 5);

  if (leaders.length === 0) return null;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 via-white to-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label="Fire leaders"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-orange-600/80">
            🔥 Leaders
          </p>
          <p className="mt-0.5 text-xs text-hub-foreground/55">
            Top picks by fire reactions in this section
          </p>
        </div>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory">
        {leaders.map((asset, index) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onOpen(asset.id)}
            className="group w-[9.5rem] shrink-0 snap-start text-left sm:w-[11rem]"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-hub-foreground/10 bg-hub-foreground/5 shadow-sm transition-shadow group-hover:shadow-md">
              <AssetMediaPreview
                type={asset.type === "video" ? "video" : "image"}
                src={asset.public_url}
                alt={asset.name}
                playMode="loop"
              />
              <span className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-md bg-hub-foreground/85 font-mono text-[0.65rem] font-bold text-white">
                {index + 1}
              </span>
              <span className="absolute top-2 right-2 rounded-md bg-orange-500 px-1.5 py-0.5 font-mono text-[0.58rem] font-semibold text-white">
                🔥 {asset.consensus.fire}
              </span>
            </div>
            <p className="mt-2 line-clamp-1 text-xs font-semibold text-hub-foreground">
              {asset.name}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
