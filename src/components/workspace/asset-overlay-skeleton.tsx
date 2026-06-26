"use client";

import { cn } from "@/lib/utils";

export function AssetOverlaySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-5", className)}>
      <div className="flex flex-wrap gap-2">
        <div className="h-10 w-20 rounded-md bg-hub-espresso/10" />
        <div className="h-10 w-20 rounded-md bg-hub-espresso/10" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-hub-espresso/10" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-11 rounded-md bg-hub-espresso/10" />
          ))}
        </div>
        <div className="h-2.5 w-full rounded-full bg-hub-espresso/10" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-20 rounded bg-hub-espresso/10" />
        <div className="space-y-2">
          <div className="h-16 rounded-md bg-hub-espresso/8" />
          <div className="h-16 rounded-md bg-hub-espresso/8" />
        </div>
      </div>
    </div>
  );
}

export function CommentsListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-16 rounded-md bg-hub-espresso/8" />
      <div className="h-14 rounded-md bg-hub-espresso/8" />
    </div>
  );
}
