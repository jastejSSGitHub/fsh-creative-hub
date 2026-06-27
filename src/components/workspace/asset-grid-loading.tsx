import { SkeletonBone, SkeletonMediaSurface } from "@/components/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

type AssetGridLoadingProps = {
  cardCount?: number;
  assetCountHint?: number;
  className?: string;
};

function LoadingCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface">
      <SkeletonMediaSurface className="aspect-[4/3]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <SkeletonBone className="size-10 rounded-md" />
          <SkeletonBone className="h-2 w-12 rounded-sm" />
        </div>
      </SkeletonMediaSurface>

      <div className="space-y-2 p-3 sm:p-4">
        <SkeletonBone className="h-4 w-4/5" />
        <SkeletonBone className="h-3 w-16" />
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
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3", className)} aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  );
}
