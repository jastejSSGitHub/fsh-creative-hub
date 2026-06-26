"use client";

import { useSyncExternalStore } from "react";

import {
  activeProjectLabel,
  DEFAULT_PROJECTS_PAGE_SNAPSHOT,
  readProjectsPageSnapshot,
  subscribeToProjectsPageSnapshot,
  type ProjectCardSnapshot,
  type ProjectsPageSnapshot,
} from "@/lib/projects/snapshot";
import { cn } from "@/lib/utils";

function useProjectsPageSnapshot(): ProjectsPageSnapshot {
  return useSyncExternalStore(
    subscribeToProjectsPageSnapshot,
    readProjectsPageSnapshot,
    () => DEFAULT_PROJECTS_PAGE_SNAPSHOT,
  );
}

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-hub-espresso/[0.07] [animation-duration:1.75s]",
        className,
      )}
    />
  );
}

const TITLE_WIDTH_CLASS: Record<ProjectCardSnapshot["titleWidth"], string> = {
  sm: "w-24",
  md: "w-36",
  lg: "w-48",
};

function ProjectCardSkeleton({ card }: { card: ProjectCardSnapshot }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-hub-espresso/10 bg-white shadow-sm">
      <div className="relative aspect-[16/10] overflow-hidden bg-hub-espresso/5">
        {card.hasCover ? (
          <Bone className="size-full rounded-none bg-hub-espresso/[0.06]" />
        ) : (
          <div className="flex size-full items-center justify-center bg-[linear-gradient(135deg,#0b0b0b_0%,#2a2418_55%,#fbf7ee_100%)]">
            <Bone className="size-10 rounded-md bg-white/15" />
          </div>
        )}
      </div>

      <div className="space-y-1 border-t border-hub-espresso/8 bg-hub-espresso/[0.03] p-3">
        <div className="flex items-start gap-2">
          <Bone className="mt-0.5 size-5 shrink-0 rounded bg-hub-espresso/[0.1]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Bone className={cn("h-4", TITLE_WIDTH_CLASS[card.titleWidth])} />
            <Bone className="h-3 w-28" />
            <Bone className="h-3 w-16" />
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

type ProjectsPageSkeletonProps = {
  snapshot?: ProjectsPageSnapshot;
};

export function ProjectsPageSkeleton({
  snapshot: snapshotProp,
}: ProjectsPageSkeletonProps = {}) {
  const storedSnapshot = useProjectsPageSnapshot();
  const snapshot = snapshotProp ?? storedSnapshot;

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
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-hub-espresso sm:text-3xl lg:text-4xl">
            Projects
          </h1>
          <p className="text-sm text-hub-espresso/55">
            {activeProjectLabel(snapshot.activeCount)}
          </p>
        </div>

        <div className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-hub-espresso/15 bg-white px-4 shadow-sm sm:w-auto">
          <Bone className="h-4 w-28 rounded-full" />
        </div>
      </div>

      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-center gap-1 border-b border-hub-espresso/10 pb-1">
        <div className="rounded-md bg-white px-3 py-1.5 shadow-sm">
          <Bone className="h-4 w-20" />
        </div>
        <div className="rounded-md px-3 py-1.5">
          <Bone className="h-4 w-12 bg-hub-espresso/[0.05]" />
        </div>
        </div>
      </div>

      {snapshot.activeCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-hub-espresso/15 bg-white/60 px-6 py-12 text-center sm:py-16">
          <Bone className="mx-auto h-8 w-64 max-w-full rounded-md" />
          <Bone className="mx-auto mt-3 h-4 w-80 max-w-full rounded-md" />
          <div className="mx-auto mt-6 inline-flex min-h-11 items-center rounded-xl border border-hub-espresso/15 bg-white px-4">
            <Bone className="h-4 w-40 rounded-md" />
          </div>
        </div>
      ) : (
        renderCardGrid(allCards)
      )}
    </section>
  );
}
