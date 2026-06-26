"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { readWorkspaceSnapshot } from "@/lib/projects/workspace-snapshot";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-hub-espresso/[0.08]",
        className,
      )}
    />
  );
}

function MemberAvatarStackSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-hub-espresso/10 bg-hub-espresso/[0.08]"
        />
      ))}
    </div>
  );
}

function AssetCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-hub-espresso/10 bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-hub-espresso/5">
        <Bone className="absolute inset-x-0 top-0 z-10 h-1 rounded-none bg-hub-espresso/15" />
        <Bone className="size-full rounded-none bg-hub-espresso/[0.06]" />
      </div>
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        <div className="space-y-1">
          <Bone className="h-5 w-4/5" />
          <Bone className="h-3 w-16" />
        </div>
        <div className="flex gap-1 pt-0.5">
          <Bone className="h-1.5 flex-1 rounded-full" />
          <Bone className="h-1.5 flex-1 rounded-full" />
          <Bone className="h-1.5 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function WorkspaceHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Bone className="h-3 w-28 rounded-sm" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Bone className="h-9 w-52 max-w-full rounded-md sm:h-10 sm:w-64" />

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-3">
          <MemberAvatarStackSkeleton count={4} />
          <div className="inline-flex min-h-10 flex-1 items-center rounded-md border border-hub-espresso/15 bg-white px-4 sm:flex-none">
            <Bone className="h-4 w-12 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyInitiativeSkeleton() {
  return (
    <div className="rounded-xl border border-dashed border-hub-espresso/15 bg-white/70 px-6 py-12 text-center">
      <Bone className="mx-auto h-6 w-52 max-w-full rounded-md" />
      <Bone className="mx-auto mt-2 h-4 w-64 max-w-full rounded-md" />
      <div className="mx-auto mt-4 inline-flex min-h-10 items-center rounded-md border border-hub-espresso/15 bg-white px-4">
        <Bone className="h-4 w-28 rounded-sm" />
      </div>
    </div>
  );
}

function WorkspaceWithInitiativesSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Bone className="h-10 w-full rounded-md sm:max-w-xs lg:hidden" />
          <div className="hidden flex-wrap gap-1 lg:flex">
            <div className="inline-flex min-h-10 items-center rounded-md border border-hub-espresso bg-hub-espresso px-4">
              <Bone className="h-4 w-24 rounded-sm bg-white/20" />
            </div>
            <div className="inline-flex min-h-10 items-center rounded-md border border-hub-espresso/15 bg-white px-4">
              <Bone className="h-4 w-28 rounded-sm" />
            </div>
          </div>
        </div>
        <div className="inline-flex min-h-10 w-full items-center rounded-md border border-hub-espresso/15 bg-white px-4 sm:w-auto">
          <Bone className="h-4 w-20 rounded-sm" />
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b border-hub-espresso/10 pb-1">
          <div className="inline-flex min-h-10 items-center rounded-t-md bg-white px-4 shadow-sm">
            <Bone className="h-4 w-12 rounded-sm" />
          </div>
          <div className="inline-flex min-h-10 items-center rounded-t-md px-4">
            <Bone className="h-4 w-10 rounded-sm bg-hub-espresso/[0.05]" />
          </div>
          <div className="inline-flex min-h-10 items-center rounded-t-md px-4">
            <Bone className="h-4 w-14 rounded-sm bg-hub-espresso/[0.05]" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <Bone className="h-28 w-full rounded-xl border border-dashed border-hub-espresso/15 bg-white/50" />

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex min-h-9 items-center rounded-md border border-hub-espresso bg-hub-espresso px-3">
            <Bone className="h-3 w-8 rounded-sm bg-white/20" />
          </div>
          {["Pending", "Approved", "Rejected", "Final"].map((label) => (
            <div
              key={label}
              className="inline-flex min-h-9 items-center rounded-md border border-hub-espresso/15 bg-white px-3"
            >
              <Bone className="h-3 w-14 rounded-sm" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <AssetCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </>
  );
}

function projectIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? null;
}

export function ProjectWorkspaceSkeleton() {
  const pathname = usePathname();
  const [hasInitiatives, setHasInitiatives] = useState(false);

  useEffect(() => {
    const projectId = projectIdFromPathname(pathname);
    if (!projectId) {
      setHasInitiatives(false);
      return;
    }

    const snapshot = readWorkspaceSnapshot(projectId);
    setHasInitiatives(snapshot?.hasInitiatives ?? false);
  }, [pathname]);

  return (
    <section
      className="min-w-0 space-y-5 sm:space-y-6"
      aria-busy="true"
      aria-label="Loading project"
    >
      <WorkspaceHeaderSkeleton />

      {hasInitiatives ? (
        <WorkspaceWithInitiativesSkeleton />
      ) : (
        <EmptyInitiativeSkeleton />
      )}
    </section>
  );
}
