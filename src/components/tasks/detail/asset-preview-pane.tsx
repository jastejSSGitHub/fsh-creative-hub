"use client";

import Link from "next/link";

import { AssetMediaPreview } from "@/components/workspace/asset-media-preview";
import { assetPath } from "@/lib/routes";
import type { LinkedAssetSummary } from "@/lib/tasks/task-assets";
import { cn } from "@/lib/utils";

type AssetPreviewPaneProps = {
  assets: LinkedAssetSummary[];
  selectedId: string;
  onSelect: (assetId: string) => void;
  className?: string;
};

function assetMediaType(asset: LinkedAssetSummary): "image" | "video" {
  if (asset.type === "video") return "video";
  if (asset.public_url?.match(/\.(mp4|webm|mov)(\?|$)/i)) return "video";
  return "image";
}

export function AssetPreviewPane({
  assets,
  selectedId,
  onSelect,
  className,
}: AssetPreviewPaneProps) {
  const selected = assets.find((a) => a.id === selectedId) ?? assets[0];
  if (!selected) return null;

  const mediaType = assetMediaType(selected);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[0.6875rem] font-medium text-hub-foreground/45">
          Linked asset
        </h3>
        <Link
          href={assetPath(selected.project_id, selected.initiative_id, selected.id)}
          className="text-[0.6875rem] font-medium text-hub-primary hover:underline"
        >
          Open full view
        </Link>
      </div>

      <div className="relative mt-2 min-h-[12rem] flex-1 overflow-hidden rounded-[8px] border border-hub-foreground/10 bg-hub-foreground/[0.03] lg:min-h-[20rem] lg:max-h-[calc(100dvh-12rem)]">
        {selected.public_url ? (
          <AssetMediaPreview
            type={mediaType}
            src={selected.public_url}
            alt={selected.name}
            className="size-full"
            playMode="static"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-hub-foreground/45">
            Preview unavailable
          </div>
        )}
      </div>

      <p className="mt-2 truncate text-sm font-medium text-hub-foreground">{selected.name}</p>

      {assets.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {assets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset.id)}
              className={cn(
                "shrink-0 rounded-[4px] border px-2 py-1 text-[0.6875rem] transition-colors",
                asset.id === selected.id
                  ? "border-hub-primary/40 bg-hub-primary/10 text-hub-primary"
                  : "border-hub-foreground/10 text-hub-foreground/60 hover:bg-hub-foreground/[0.04]",
              )}
            >
              {asset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
