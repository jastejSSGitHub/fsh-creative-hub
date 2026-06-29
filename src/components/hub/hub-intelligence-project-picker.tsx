"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  filterIntelligenceProjectOptions,
  paginateIntelligenceProjectOptions,
  type IntelligenceProjectOption,
} from "@/lib/intelligence/project-options";
import { roleLabel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export type { IntelligenceProjectOption };

const PAGE_SIZE = 5;

type HubIntelligenceProjectPickerProps = {
  projects: IntelligenceProjectOption[];
  loading: boolean;
  error: string | null;
  onSelect: (project: IntelligenceProjectOption) => void;
  filterQuery?: string;
  className?: string;
};

function ProjectPickerThumbnail({
  project,
}: {
  project: IntelligenceProjectOption;
}) {
  const [coverError, setCoverError] = useState(false);

  if (project.cover_url && !coverError) {
    return (
      <span className="relative size-8 shrink-0 overflow-hidden rounded-md border border-black/[0.06] bg-hub-foreground/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-200 group-hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.cover_url}
          alt=""
          className="size-full object-cover"
          onError={() => setCoverError(true)}
          draggable={false}
        />
      </span>
    );
  }

  const initials = project.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/[0.06] bg-[linear-gradient(135deg,#0b0b0b_0%,#2a2418_55%,#fbf7ee_100%)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-200 group-hover:scale-105"
    >
      <span className="font-display text-[0.58rem] font-extrabold tracking-tight text-white/90">
        {initials || "?"}
      </span>
    </span>
  );
}

function ProjectPickerSkeleton() {
  return (
    <ul className="py-0.5" role="list" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="flex items-center gap-2.5 px-2.5 py-2">
          <span className="size-8 shrink-0 animate-pulse rounded-md bg-hub-foreground/[0.06]" />
          <span className="min-w-0 flex-1 space-y-1.5">
            <span className="block h-3.5 w-28 animate-pulse rounded bg-hub-foreground/[0.06]" />
            <span className="block h-3 w-20 animate-pulse rounded bg-hub-foreground/[0.04]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HubIntelligenceProjectPicker({
  projects,
  loading,
  error,
  onSelect,
  filterQuery = "",
  className,
}: HubIntelligenceProjectPickerProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filterQuery]);

  const filtered = useMemo(
    () => filterIntelligenceProjectOptions(projects, filterQuery),
    [projects, filterQuery],
  );

  const paged = useMemo(
    () => paginateIntelligenceProjectOptions(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const showSkeleton = loading && projects.length === 0;

  return (
    <div
      className={cn(
        "mt-1 overflow-hidden rounded-lg border border-hub-primary/15 bg-hub-primary/[0.03] shadow-[inset_0_0_0_1px_rgba(24,160,251,0.06)]",
        className,
      )}
    >
      <div className="border-b border-hub-primary/10 px-2.5 py-1.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-hub-foreground/40">
          Choose a project
        </p>
      </div>

      {showSkeleton && <ProjectPickerSkeleton />}

      {error && !showSkeleton && (
        <p className="px-3 py-3 text-xs text-hub-foreground/50">{error}</p>
      )}

      {!showSkeleton && !error && paged.items.length === 0 && (
        <p className="px-3 py-3 text-xs text-hub-foreground/45">
          {filterQuery.trim()
            ? `No projects match “${filterQuery.trim()}”.`
            : "You are not a member of any projects yet."}
        </p>
      )}

      {!showSkeleton && !error && paged.items.length > 0 && (
        <ul className="max-h-44 overflow-y-auto py-0.5" role="list">
          {paged.items.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(project)}
                className="group flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-hub-foreground/[0.03] active:scale-[0.99]"
              >
                <ProjectPickerThumbnail project={project} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-hub-foreground/85">
                    {project.name}
                  </span>
                  <span className="block truncate text-xs text-hub-foreground/36">
                    {project.description?.trim() ||
                      `${roleLabel(project.role)} access`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showSkeleton && paged.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-hub-primary/10 px-2 py-1.5">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={paged.page <= 1}
            className="flex size-6 items-center justify-center rounded-md text-hub-foreground/40 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground/65 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="text-[0.62rem] tabular-nums text-hub-foreground/35">
            {paged.total === 0
              ? "0 projects"
              : `${(paged.page - 1) * paged.pageSize + 1}–${Math.min(paged.page * paged.pageSize, paged.total)} of ${paged.total}`}
          </span>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              setPage((current) => Math.min(paged.totalPages, current + 1))
            }
            disabled={paged.page >= paged.totalPages}
            className="flex size-6 items-center justify-center rounded-md text-hub-foreground/40 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground/65 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
