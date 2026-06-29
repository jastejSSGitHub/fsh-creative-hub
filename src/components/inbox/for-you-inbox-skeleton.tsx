import { LoadingAffirmation } from "@/components/hub/loading-affirmation";
import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

const FOR_YOU_LOADING_MESSAGES = [
  "Gathering what needs you…",
  "Checking mentions and replies…",
  "Sorting your inbox…",
  "Almost there…",
] as const;

function InboxRowSkeleton({ width = "w-56" }: { width?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-hub-foreground/6 px-3 py-3.5 sm:px-6">
      <SkeletonBone className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBone className={cn("h-3.5", width)} />
        <SkeletonBone className="h-3 w-full max-w-md" />
        <SkeletonBone className="h-2.5 w-24" />
      </div>
    </div>
  );
}

const ROW_WIDTHS = ["w-48", "w-64", "w-40", "w-56", "w-52", "w-44"] as const;

export function ForYouInboxSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-busy="true"
      aria-label="Loading For You inbox"
    >
      <div className="flex min-h-0 flex-1">
        <aside
          className="hidden w-56 shrink-0 border-r border-hub-foreground/8 bg-hub-surface-muted lg:block"
          aria-hidden
        >
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBone key={index} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-hub-paper">
          <div className="border-b border-hub-foreground/8 px-3 py-3 sm:px-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <SkeletonBone className="mt-0.5 size-9 shrink-0 rounded-md lg:hidden" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBone className="h-6 w-32" />
                <SkeletonBone className="hidden h-3.5 w-56 sm:block" />
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-hidden border-t border-hub-foreground/6 pt-3 lg:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBone key={index} className="h-8 w-20 shrink-0 rounded-md" />
              ))}
            </div>
          </div>

          <div className="flex-1">
            {ROW_WIDTHS.map((width, index) => (
              <InboxRowSkeleton key={index} width={width} />
            ))}
          </div>

          <div className="px-4 py-8">
            <LoadingAffirmation messages={FOR_YOU_LOADING_MESSAGES} />
          </div>
        </div>
      </div>
    </div>
  );
}
