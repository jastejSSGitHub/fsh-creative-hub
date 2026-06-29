"use client";

import { FilterBuilderDialog } from "@/components/tasks/filters/filter-builder-dialog";
import { TasksSidebar } from "@/components/tasks/tasks-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { TEAM_LABEL_SLUGS } from "@/lib/tasks/constants";
import type { HubFilter, HubLabel } from "@/types/database";
import { cn } from "@/lib/utils";
import { useState } from "react";

type TasksBrowseViewProps = {
  filters: HubFilter[];
  labels: HubLabel[];
  taskCountsByLabel?: Record<string, number>;
  onRefresh: () => void;
};

export function TasksBrowseView({
  filters,
  labels,
  taskCountsByLabel,
  onRefresh,
}: TasksBrowseViewProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const presetFilters = filters.filter((filter) => filter.is_preset || filter.owner_id == null);
  const teamLabels = labels.filter((label) =>
    (TEAM_LABEL_SLUGS as readonly string[]).includes(label.name),
  );

  return (
    <div className="space-y-6">
      <p className="max-w-lg text-sm leading-relaxed text-hub-foreground/55">
        Open a saved filter or team label to focus your task list. On desktop, these same
        shortcuts live in the left sidebar.
      </p>

      {presetFilters.length === 0 && teamLabels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hub-foreground/15 bg-hub-surface/60 px-6 py-10 text-center">
          <p className="font-display text-xl font-extrabold text-hub-foreground">
            No filters or teams yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-hub-foreground/55">
            Create a smart filter to save a custom slice of your work, or tag tasks with team
            labels as you add them.
          </p>
          <button
            type="button"
            onClick={() => setFilterDialogOpen(true)}
            className={cn(buttonVariants({ size: "lg" }), "mt-5 rounded-xl")}
          >
            Create filter
          </button>
        </div>
      ) : (
        <TasksSidebar
          layout="page"
          filters={filters}
          labels={labels}
          taskCountsByLabel={taskCountsByLabel}
        />
      )}

      {presetFilters.length > 0 || teamLabels.length > 0 ? (
        <button
          type="button"
          onClick={() => setFilterDialogOpen(true)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-hub-foreground/60 hover:text-hub-foreground",
          )}
        >
          Create filter
        </button>
      ) : null}

      <FilterBuilderDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onCreated={onRefresh}
      />
    </div>
  );
}
