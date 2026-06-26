import {
  activeProjectLabel,
  type ProjectCardSnapshot,
  type ProjectsPageSnapshot,
} from "@/lib/projects/snapshot";
import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

const TITLE_WIDTH_CLASS: Record<ProjectCardSnapshot["titleWidth"], string> = {
  sm: "w-24",
  md: "w-36",
  lg: "w-48",
};

function ProjectCardSkeleton({ card }: { card: ProjectCardSnapshot }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface">
      <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#faf8f3_0%,#f3efe6_55%,#ffffff_100%)]">
        {card.hasCover ? (
          <SkeletonBone className="size-full rounded-none bg-hub-foreground/[0.05]" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <SkeletonBone className="size-10 rounded-md" />
          </div>
        )}
      </div>

      <div className="space-y-1 border-t border-hub-foreground/8 bg-hub-foreground/[0.03] p-3">
        <div className="flex items-start gap-2">
          <SkeletonBone className="mt-0.5 size-5 shrink-0 rounded bg-hub-foreground/[0.1]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <SkeletonBone className={cn("h-4", TITLE_WIDTH_CLASS[card.titleWidth])} />
            <SkeletonBone className="h-3 w-28" />
            <SkeletonBone className="h-3 w-16" />
          </div>
        </div>
      </div>
    </article>
  );
}

function renderCardGrid(cards: ProjectCardSnapshot[]) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <ProjectCardSkeleton key={index} card={card} />
      ))}
    </div>
  );
}

type ProjectsPageSkeletonViewProps = {
  snapshot: ProjectsPageSnapshot;
};

export function ProjectsPageSkeletonView({
  snapshot,
}: ProjectsPageSkeletonViewProps) {
  const favoriteCards = snapshot.showFavoritesSection
    ? snapshot.cards.slice(0, snapshot.favoriteCount)
    : [];
  const regularCards = snapshot.showFavoritesSection
    ? snapshot.cards.slice(snapshot.favoriteCount)
    : snapshot.cards;
  const allCards = [...favoriteCards, ...regularCards];

  return (
    <section
      className="min-w-0 space-y-5 sm:space-y-6"
      aria-busy="true"
      aria-label="Loading projects"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-hub-foreground sm:text-3xl lg:text-4xl">
            Projects
          </h1>
          <p className="text-sm text-hub-foreground/55">
            {activeProjectLabel(snapshot.activeCount)}
          </p>
        </div>

        <SkeletonBone className="h-9 w-full shrink-0 self-end rounded-[6px] sm:w-[8.75rem]" />
      </div>

      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-center gap-1 border-b border-hub-foreground/10 pb-1">
          <div className="rounded-md bg-hub-accent/10 px-3 py-1.5">
            <SkeletonBone className="h-4 w-20" />
          </div>
          <div className="rounded-md px-3 py-1.5">
            <SkeletonBone className="h-4 w-12 bg-hub-foreground/[0.05]" />
          </div>
        </div>
      </div>

      {snapshot.activeCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-hub-foreground/15 bg-hub-surface/60 px-6 py-12 text-center sm:py-16">
          <SkeletonBone className="mx-auto h-8 w-64 max-w-full rounded-md" />
          <SkeletonBone className="mx-auto mt-3 h-4 w-80 max-w-full rounded-md" />
          <div className="mx-auto mt-6 inline-flex min-h-11 items-center rounded-xl border border-hub-foreground/15 bg-hub-surface px-4">
            <SkeletonBone className="h-4 w-40 rounded-md" />
          </div>
        </div>
      ) : (
        renderCardGrid(allCards)
      )}
    </section>
  );
}
