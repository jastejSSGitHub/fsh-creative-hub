"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useTransition } from "react";

import { createClient } from "@/lib/supabase/client";
import { restoreAssetVersionAction } from "@/lib/workspace/actions";
import {
  getAssetVersionHistory,
  type AssetVersionSummary,
} from "@/lib/workspace/asset-versions";
import { STATUS_STYLES } from "@/components/workspace/asset-status";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";

type AssetVersionHistoryProps = {
  assetId: string;
  projectId: string;
  boardId?: string;
  editable: boolean;
  refreshToken?: number;
  onRestored: () => void;
};

export function AssetVersionHistory({
  assetId,
  projectId,
  boardId,
  editable,
  refreshToken = 0,
  onRestored,
}: AssetVersionHistoryProps) {
  const [versions, setVersions] = useState<AssetVersionSummary[]>([]);
  const [rootId, setRootId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadHistory = useCallback(async () => {
    const supabase = createClient();
    const data = await getAssetVersionHistory(supabase, assetId);
    if (!data) {
      setVersions([]);
      setRootId(null);
      return;
    }
    setRootId(data.root.id);
    setVersions(data.versions);
  }, [assetId]);

  useEffect(() => {
    void loadHistory();
  }, [assetId, refreshToken, loadHistory]);

  if (versions.length <= 1) return null;

  const archived = versions.filter((v) => !v.isCurrent);

  return (
    <div className="border-t border-hub-foreground/10 px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-hub-foreground/45">
          Version history
        </span>
        <span className="font-mono text-[0.625rem] text-hub-foreground/40">
          v{versions.length} {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded && (
        <ul className="mt-2 space-y-2">
          {versions.map((version) => (
            <li
              key={version.id}
              className={cn(
                "flex items-center gap-2 rounded-[6px] border px-2 py-1.5",
                version.isCurrent
                  ? "border-hub-primary/25 bg-hub-primary/5"
                  : "border-hub-foreground/10",
              )}
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded bg-hub-foreground/5">
                {version.public_url ? (
                  version.type === "video" ? (
                    <video
                      src={version.public_url}
                      className="size-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <Image
                      src={version.public_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  )
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-hub-foreground">
                  v{version.versionNumber}
                  {version.isCurrent ? " · Current" : ""}
                </p>
                <p className="truncate text-[0.625rem] text-hub-foreground/55">
                  {version.name}
                </p>
                <p className="text-[0.625rem] text-hub-foreground/45">
                  {STATUS_STYLES[version.status].label} · {formatRelativeTime(version.created_at)}
                </p>
              </div>
              {editable && !version.isCurrent && rootId && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await restoreAssetVersionAction({
                        rootAssetId: rootId,
                        versionAssetId: version.id,
                        projectId,
                        boardId,
                      });
                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }
                      await loadHistory();
                      onRestored();
                    });
                  }}
                  className="shrink-0 text-[0.625rem] font-medium text-hub-primary hover:underline disabled:opacity-60"
                >
                  Restore
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && !expanded && (
        <p className="mt-1 text-[0.625rem] text-hub-foreground/40">
          {archived.length} earlier version{archived.length === 1 ? "" : "s"} archived
        </p>
      )}

      {error ? (
        <p className="mt-2 text-xs text-hub-rejected" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
