"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { NavBackLinkSkeleton } from "@/components/ui/nav-back-link";
import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import { readProjectNavigationSnapshot } from "@/lib/projects/project-navigation-snapshot";
import { hubCardGridClassName } from "@/lib/ui/hub-card-grid";
import { cn } from "@/lib/utils";

function ProjectFileCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-hub-foreground/10 bg-hub-surface">
      <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#faf8f3_0%,#f3efe6_55%,#ffffff_100%)]">
        <div className="flex size-full flex-col items-center justify-center gap-2">
          <SkeletonBone className="size-12 rounded-md" />
          <SkeletonBone className="h-2.5 w-16 rounded-sm" />
        </div>
      </div>

      <div className="space-y-2 border-t border-hub-foreground/8 bg-hub-foreground/[0.02] p-3">
        <div className="flex items-start gap-2">
          <SkeletonBone className="mt-0.5 size-5 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <SkeletonBone className="h-4 w-3/5" />
            <SkeletonBone className="h-3 w-24" />
            <SkeletonBone className="h-3 w-16" />
          </div>
          <SkeletonBone className="mt-0.5 size-6 shrink-0 rounded-full" />
        </div>
      </div>
    </article>
  );
}

function projectIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? null;
}

export function ProjectHomeLoadingSkeleton() {
  const pathname = usePathname();
  const snapshot = useMemo(() => {
    const projectId = projectIdFromPathname(pathname);
    if (!projectId) return null;
    return readProjectNavigationSnapshot(projectId);
  }, [pathname]);

  const cardCount = snapshot?.fileCount
    ? Math.min(Math.max(snapshot.fileCount, 1), 6)
    : 3;

  return (
    <section
      className="min-w-0 space-y-5"
      aria-busy="true"
      aria-label="Loading project"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <NavBackLinkSkeleton className="justify-self-start" />

        <div className="flex justify-center justify-self-center px-2">
          {snapshot?.projectName ? (
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-hub-foreground sm:text-3xl">
              {snapshot.projectName}
            </h1>
          ) : (
            <SkeletonBone className="h-8 w-36 max-w-full rounded-md sm:h-9 sm:w-44" />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end justify-self-end gap-2">
          <SkeletonBone className="h-9 w-28 rounded-[6px]" />
          <SkeletonBone className="h-9 w-16 rounded-[6px]" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <SkeletonBone className="h-9 w-28 rounded-[6px]" />
        <SkeletonBone className="h-9 w-32 rounded-[6px]" />
      </div>

      <SkeletonBone className="h-16 w-full rounded-md" />

      <div className="space-y-0">
        <SkeletonBone className="h-7 w-20 rounded-sm" aria-hidden />
        <div className={cn(hubCardGridClassName, "-mt-7")}>
          {Array.from({ length: cardCount }).map((_, index) => (
            <ProjectFileCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
