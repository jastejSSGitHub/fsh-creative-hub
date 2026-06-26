import { cn } from "@/lib/utils";

export function SkeletonBone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-hub-foreground/[0.06] [animation-duration:1.75s]",
        className,
      )}
    />
  );
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-hub-foreground/8 bg-hub-foreground/[0.05]",
        className,
      )}
    />
  );
}
