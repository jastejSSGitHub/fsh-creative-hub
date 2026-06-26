"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { AssetGridLoading } from "@/components/workspace/asset-grid-loading";
import { NavBackLabel, NavBackLinkSkeleton } from "@/components/ui/nav-back-link";
import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import { readReviewBoardNavigationSnapshot } from "@/lib/projects/review-board-snapshot";
import { cn } from "@/lib/utils";

function ReviewBoardHeaderSkeleton({
  projectName,
  boardName,
}: {
  projectName?: string;
  boardName?: string;
}) {
  return (
    <div className="space-y-3">
      {projectName ? (
        <NavBackLabel label={projectName} />
      ) : (
        <NavBackLinkSkeleton />
      )}

      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <SkeletonBone className="mx-auto h-3 w-24 rounded-sm" />
        {boardName ? (
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-hub-foreground sm:text-3xl">
            {boardName}
          </h1>
        ) : (
          <SkeletonBone className="mx-auto h-9 w-64 max-w-full rounded-md sm:h-10" />
        )}
      </div>
    </div>
  );
}

function SectionTabsSkeleton({ sectionCount }: { sectionCount: number }) {
  const tabCount = Math.max(sectionCount, 2);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="hidden flex-wrap gap-1 lg:flex">
        {Array.from({ length: Math.min(tabCount, 4) }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "inline-flex min-h-10 items-center rounded-md border px-4",
              index === 0
                ? "border-hub-accent/35 bg-hub-accent/15"
                : "border-hub-foreground/10 bg-hub-surface/80",
            )}
          >
            <SkeletonBone
              className={cn(
                "h-4 rounded-sm",
                index === 0 ? "w-24 bg-hub-foreground/[0.08]" : "w-28",
              )}
            />
          </div>
        ))}
      </div>
      <SkeletonBone className="h-10 w-full rounded-md sm:max-w-xs lg:hidden" />
      <SkeletonBone className="h-10 w-full rounded-md sm:w-36" />
    </div>
  );
}

function parseReviewBoardPath(pathname: string): {
  projectId: string;
  boardId: string;
} | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/boards\/([^/]+)/);
  if (!match) return null;
  return { projectId: match[1], boardId: match[2] };
}

export function ReviewBoardLoadingSkeleton() {
  const pathname = usePathname();

  const boardPath = useMemo(() => parseReviewBoardPath(pathname), [pathname]);
  const snapshot = useMemo(() => {
    if (!boardPath) return null;
    return readReviewBoardNavigationSnapshot(boardPath.projectId, boardPath.boardId);
  }, [boardPath]);

  const hasInitiatives = snapshot ? snapshot.sectionCount > 0 : false;

  return (
    <section
      className="min-w-0 space-y-5 sm:space-y-6"
      aria-busy="true"
      aria-label="Loading review board"
    >
      <ReviewBoardHeaderSkeleton
        projectName={snapshot?.projectName}
        boardName={snapshot?.boardName}
      />

      {hasInitiatives ? (
        <>
          <div className="flex justify-center px-1">
            <SkeletonBone className="h-12 w-full max-w-lg rounded-xl sm:max-w-xl" />
          </div>

          <SectionTabsSkeleton sectionCount={snapshot?.sectionCount ?? 2} />

          <div className="space-y-5">
            <SkeletonBone className="h-28 w-full rounded-xl border border-dashed border-hub-foreground/12 bg-hub-foreground/[0.03]" />

            <div className="flex flex-wrap gap-2">
              <SkeletonBone className="h-9 w-12 rounded-md bg-hub-foreground/[0.08]" />
              {["Pending", "Approved", "Rejected", "Final"].map((label) => (
                <SkeletonBone key={label} className="h-9 w-20 rounded-md" />
              ))}
            </div>

            <AssetGridLoading assetCountHint={snapshot?.assetCount} />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-hub-foreground/12 bg-hub-surface/70 px-6 py-12 text-center">
          <SkeletonBone className="mx-auto h-6 w-52 max-w-full rounded-md" />
          <SkeletonBone className="mx-auto mt-2 h-4 w-64 max-w-full rounded-md" />
        </div>
      )}
    </section>
  );
}
