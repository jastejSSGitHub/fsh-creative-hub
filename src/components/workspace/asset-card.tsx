"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { AssetWithVotes } from "@/lib/workspace/queries";
import { AssetOptionsMenu } from "@/components/workspace/asset-options-menu";
import { AssetMediaPreview } from "@/components/workspace/asset-media-preview";
import { STATUS_STYLES } from "@/components/workspace/asset-status";
import { canDeleteOwnAsset } from "@/lib/permissions";
import type { HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

type AssetCardProps = {
  asset: AssetWithVotes;
  userId: string;
  role: HubRole;
  highlighted?: boolean;
  onOpen: () => void;
  onDeleteRequest?: () => void;
};

export function AssetCard({
  asset,
  userId,
  role,
  highlighted = false,
  onOpen,
  onDeleteRequest,
}: AssetCardProps) {
  const reduceMotion = useReducedMotion();
  const status = STATUS_STYLES[asset.status];
  const canDelete = canDeleteOwnAsset(role, userId, asset.uploaded_by);
  const showOptionsMenu = onDeleteRequest != null;

  return (
    <motion.div
      id={`asset-card-${asset.id}`}
      layout={false}
      animate={
        highlighted && !reduceMotion
          ? {
              boxShadow: [
                "0 1px 2px rgba(11,11,11,0.05)",
                "0 0 0 1px rgba(24,160,251,0.38), 0 0 0 5px rgba(24,160,251,0.1)",
                "0 1px 2px rgba(11,11,11,0.05)",
              ],
            }
          : undefined
      }
      transition={
        highlighted && !reduceMotion
          ? { duration: 2.4, ease: [0.4, 0, 0.2, 1] }
          : undefined
      }
      className={cn(
        "group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-hub-surface text-left shadow-sm transition-shadow hover:shadow-md",
        highlighted
          ? "border-hub-primary/35"
          : "border-hub-foreground/10",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-hub-foreground/5">
        <span className={cn("absolute inset-x-0 top-0 z-10 h-1", status.stripe)} />
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 z-0 block size-full cursor-pointer"
          aria-label={`Open ${asset.name}`}
        >
          <AssetMediaPreview
            type={asset.type === "video" ? "video" : "image"}
            src={asset.public_url}
            alt={asset.name}
            playMode="loop"
          />
        </button>
        {asset.status === "final" && (
          <span className="pointer-events-none absolute top-3 left-3 z-10 rounded-md bg-hub-final px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-hub-foreground">
            Final pick
          </span>
        )}
        {showOptionsMenu && (
          <AssetOptionsMenu
            className="absolute top-2 right-2 z-20"
            canDelete={canDelete}
            onView={onOpen}
            onDelete={onDeleteRequest}
          />
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col gap-1.5 p-3 text-left sm:p-4"
      >
        <div className="space-y-1">
          <p className="line-clamp-1 font-display text-base font-bold text-hub-foreground">
            {asset.name}
          </p>
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-hub-foreground/45">
            {asset.tag}
          </p>
        </div>
        {asset.legacy_approved_by && (asset.status === "approved" || asset.status === "final") && (
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-hub-approved">
            Approved by {asset.legacy_approved_by}
          </p>
        )}
      </button>
    </motion.div>
  );
}
