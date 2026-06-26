"use client";

import type { AssetWithVotes } from "@/lib/workspace/queries";
import { ConsensusBar } from "@/components/workspace/consensus-bar";
import { AssetMediaPreview } from "@/components/workspace/asset-media-preview";
import { STATUS_STYLES } from "@/components/workspace/asset-status";
import { cn } from "@/lib/utils";

type AssetCardProps = {
  asset: AssetWithVotes;
  onOpen: () => void;
};

export function AssetCard({ asset, onOpen }: AssetCardProps) {
  const status = STATUS_STYLES[asset.status];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-hub-foreground/5">
        <span className={cn("absolute inset-x-0 top-0 z-10 h-1", status.stripe)} />
        <AssetMediaPreview
          type={asset.type === "video" ? "video" : "image"}
          src={asset.public_url}
          alt={asset.name}
          playMode="loop"
        />
        {asset.status === "final" && (
          <span className="absolute top-3 right-3 rounded-md bg-hub-final px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-hub-foreground">
            Final pick
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="space-y-1">
          <p className="line-clamp-1 font-display text-base font-bold text-hub-foreground">
            {asset.name}
          </p>
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-hub-foreground/45">
            {asset.tag}
          </p>
        </div>
        <ConsensusBar counts={asset.consensus} size="sm" />
        {asset.legacy_approved_by && (asset.status === "approved" || asset.status === "final") && (
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-hub-approved">
            Approved by {asset.legacy_approved_by}
          </p>
        )}
      </div>
    </button>
  );
}
