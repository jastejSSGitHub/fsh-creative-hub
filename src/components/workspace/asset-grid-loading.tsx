import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

type AssetGridLoadingProps = {
  cardCount?: number;
  assetCountHint?: number;
  className?: string;
};

function LoadingCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface">
      <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,#faf8f3_0%,#f3efe6_55%,#ffffff_100%)]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <SkeletonBone className="size-10 rounded-md" />
          <SkeletonBone className="h-2 w-12 rounded-sm" />
        </div>
      </div>

      <div className="space-y-2 p-3 sm:p-4">
        <SkeletonBone className="h-4 w-4/5" />
        <SkeletonBone className="h-3 w-16" />
        <div className="flex gap-1 pt-0.5">
          {Array.from({ length: 3 }).map((_, barIndex) => (
            <SkeletonBone key={barIndex} className="h-1.5 flex-1 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AssetGridLoading({
  cardCount = 6,
  assetCountHint,
  className,
}: AssetGridLoadingProps) {
  const count = assetCountHint
    ? Math.min(Math.max(assetCountHint, 3), 9)
    : cardCount;

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3", className)} aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  );
}
