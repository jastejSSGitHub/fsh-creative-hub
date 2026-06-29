"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { AssetGridLoading } from "@/components/workspace/asset-grid-loading";
import { NavBackLinkSkeleton } from "@/components/ui/nav-back-link";
import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import { useReviewBoardNavigationSnapshot } from "@/lib/projects/use-review-board-navigation-snapshot";
import { cn } from "@/lib/utils";

function ReviewBoardHeaderSkeleton({
  boardName,
}: {
  projectName?: string;
  boardName?: string;
}) {
  return (
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
  );
}

function SectionTabsSkeleton({ sectionCount }: { sectionCount: number }) {
  const tabCount = Math.max(sectionCount, 2);
  const tabWidths = ["w-28", "w-16", "w-24", "w-20"];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2 pb-0.5">
          {Array.from({ length: Math.min(tabCount, 4) }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full border px-3.5",
                index === 0
                  ? "border-hub-accent/35 bg-hub-accent/15"
                  : "border-hub-foreground/10 bg-hub-surface/80",
              )}
            >
              <SkeletonBone
                className={cn(
                  "h-4 rounded-sm",
                  tabWidths[index] ?? "w-20",
                  index === 0 && "bg-hub-skeleton-strong",
                )}
              />
            </div>
          ))}
        </div>
      </div>
      <SkeletonBone className="h-8 w-full rounded-[6px] sm:w-28" />
    </div>
  );
}

function StickyHeaderSkeleton() {
  return (
    <div className="sticky top-0 z-40 border-b border-hub-foreground/8 bg-hub-paper/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-3 py-2 sm:px-6">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <NavBackLinkSkeleton />
          <div className="flex items-center gap-2">
            <SkeletonBone className="h-7 w-24 rounded-full" />
            <SkeletonBone className="h-8 w-16 rounded-[6px]" />
          </div>
        </div>
      </div>
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
  const snapshot = useReviewBoardNavigationSnapshot(
    boardPath?.projectId,
    boardPath?.boardId,
  );

  const hasInitiatives = snapshot ? snapshot.sectionCount > 0 : false;

  return (
    <>
      <StickyHeaderSkeleton />
      <section
        className="mx-auto min-w-0 max-w-6xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-6"
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
            <SkeletonBone className="h-28 w-full rounded-xl border border-dashed border-hub-foreground/12 bg-hub-skeleton-panel" />

            <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-2 pb-0.5">
                {["Pending", "Approved", "Rejected", "Final"].map((label) => (
                  <SkeletonBone key={label} className="h-8 w-20 shrink-0 rounded-full" />
                ))}
              </div>
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
    </>
  );
}
