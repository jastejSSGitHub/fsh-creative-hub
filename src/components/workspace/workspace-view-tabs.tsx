"use client";

import { Activity, Grid3x3, Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkspaceView = "assets" | "ideas" | "activity";

type WorkspaceViewTabsProps = {
  view: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
  ideaCount?: number;
  activityCount?: number;
  variant?: "default" | "prominent";
};

const TABS: {
  id: WorkspaceView;
  label: string;
  shortLabel: string;
  icon: typeof Grid3x3;
}[] = [
  { id: "assets", label: "Assets", shortLabel: "Assets", icon: Grid3x3 },
  { id: "ideas", label: "Ideas", shortLabel: "Ideas", icon: Lightbulb },
  { id: "activity", label: "Activity", shortLabel: "Activity", icon: Activity },
];

export function WorkspaceViewTabs({
  view,
  onChange,
  ideaCount,
  activityCount,
  variant = "default",
}: WorkspaceViewTabsProps) {
  const prominent = variant === "prominent";

  function countFor(id: WorkspaceView): number | undefined {
    if (id === "ideas") return ideaCount;
    if (id === "activity") return activityCount;
    return undefined;
  }

  return (
    <div
      className={cn(
        "flex rounded-xl border border-hub-foreground/10 bg-hub-surface shadow-sm",
        prominent ? "w-full max-w-lg p-1 sm:max-w-xl sm:p-1.5" : "p-1",
      )}
      role="tablist"
      aria-label="Workspace views"
    >
      {TABS.map((tab) => {
        const active = view === tab.id;
        const count = countFor(tab.id);
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 rounded-lg transition-all",
              prominent
                ? "min-h-11 gap-1.5 px-2 text-xs font-semibold sm:min-h-12 sm:gap-2 sm:px-4 sm:text-[0.9375rem] lg:min-h-11 lg:px-6"
                : "min-h-11 px-3 text-sm font-medium sm:min-h-10 sm:flex-none sm:px-5",
              active
                ? "bg-hub-espresso text-hub-paper shadow-sm"
                : "text-hub-foreground/55 hover:bg-hub-foreground/[0.04] hover:text-hub-foreground",
            )}
          >
            <Icon
              className={cn("shrink-0", prominent ? "size-4 sm:size-[1.125rem]" : "size-4")}
              aria-hidden
            />
            <>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </>
            {count != null && count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono font-semibold leading-none",
                  prominent ? "text-[0.6rem]" : "text-[0.55rem]",
                  active ? "bg-white/15 text-hub-paper" : "bg-hub-foreground/8 text-hub-foreground/50",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
