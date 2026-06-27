"use client";

import { SkeletonBlock } from "@/components/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

export function AssetOverlaySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-5", className)}>
      <div className="flex flex-wrap gap-2">
        <SkeletonBlock className="h-10 w-20 rounded-md" />
        <SkeletonBlock className="h-10 w-20 rounded-md" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-16 rounded" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-11 rounded-md" />
          ))}
        </div>
        <SkeletonBlock className="h-2.5 w-full rounded-full" />
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-20 rounded" />
        <div className="space-y-2">
          <SkeletonBlock className="h-16 rounded-md" />
          <SkeletonBlock className="h-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function CommentsListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <SkeletonBlock className="h-16 rounded-md" />
      <SkeletonBlock className="h-14 rounded-md" />
    </div>
  );
}
