import { LoadingAffirmation } from "@/components/hub/loading-affirmation";
import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

const TASKS_LOADING_MESSAGES = [
  "Loading your tasks…",
  "Sorting by what's due…",
  "Pulling in your projects…",
  "Almost ready…",
] as const;

function TaskRowSkeleton({ width = "w-48" }: { width?: string }) {
  return (
    <div className="flex min-h-11 items-center gap-3 rounded-[6px] border border-hub-foreground/6 bg-hub-surface px-3 py-2 lg:min-h-10">
      <SkeletonBone className="size-4 shrink-0 rounded-full" />
      <SkeletonBone className={cn("h-3.5 flex-1", width)} />
      <SkeletonBone className="hidden h-5 w-14 shrink-0 rounded-full sm:block" />
    </div>
  );
}

function SidebarNavSkeleton() {
  return (
    <aside className="hidden w-52 shrink-0 flex-col gap-6 lg:flex">
      <nav className="space-y-1" aria-hidden>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBone key={index} className="h-9 w-full rounded-[6px]" />
        ))}
      </nav>
      <div className="space-y-2">
        <SkeletonBone className="mx-2.5 h-3 w-12" />
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBone key={index} className="h-9 w-full rounded-[6px]" />
        ))}
      </div>
    </aside>
  );
}

const ROW_WIDTHS = ["w-56", "w-40", "w-64", "w-48", "w-52", "w-44"] as const;

type TasksWorkspaceSkeletonProps = {
  title?: string;
};

export function TasksWorkspaceSkeleton({ title = "Today" }: TasksWorkspaceSkeletonProps) {
  return (
    <div
      className="flex min-h-[calc(100dvh-2.75rem)] flex-col pb-20 lg:pb-0"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
        <SidebarNavSkeleton />

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-xl font-extrabold tracking-tight text-hub-foreground">
              {title}
            </h1>
            <SkeletonBone className="h-9 w-24 rounded-[6px]" />
          </div>

          <div className="space-y-2">
            {ROW_WIDTHS.map((width, index) => (
              <TaskRowSkeleton key={index} width={width} />
            ))}
          </div>

          <div className="mt-8">
            <LoadingAffirmation messages={TASKS_LOADING_MESSAGES} />
          </div>
        </div>
      </div>
    </div>
  );
}
