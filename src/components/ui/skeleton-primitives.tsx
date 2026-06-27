import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const skeletonBoneClassName =
  "animate-pulse rounded-md bg-hub-skeleton [animation-duration:1.75s]";

export function SkeletonBone({ className }: { className?: string }) {
  return <div className={cn(skeletonBoneClassName, className)} />;
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-hub-foreground/8 bg-hub-skeleton-muted",
        className,
      )}
    />
  );
}

/** Card/media placeholder behind skeleton bones — theme-aware (light cream vs dark grey). */
export function SkeletonMediaSurface({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("hub-skeleton-media relative overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-hub-skeleton-strong", className)} />
  );
}
