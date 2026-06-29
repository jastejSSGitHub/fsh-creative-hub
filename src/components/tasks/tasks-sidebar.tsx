"use client";

import type { ReactNode } from "react";
import {
  AlarmClock,
  Calendar,
  CalendarRange,
  Code,
  Filter,
  Hourglass,
  Inbox,
  ListChecks,
  Megaphone,
  Palette,
  type LucideIcon,
} from "lucide-react";

import { useTasksNavigation } from "@/components/tasks/tasks-navigation-context";

import {
  TASKS_INBOX_PATH,
  TASKS_TODAY_PATH,
  TASKS_UPCOMING_PATH,
  projectTasksFilterPath,
  projectTasksLabelPath,
  projectTasksViewPath,
  tasksFilterPath,
  tasksLabelPath,
} from "@/lib/routes";
import { TEAM_LABEL_SLUGS } from "@/lib/tasks/constants";
import { getTeamLabelColor } from "@/lib/tasks/team-label-colors";
import type { HubFilter, HubLabel } from "@/types/database";
import { cn } from "@/lib/utils";

type TasksSidebarProps = {
  filters: HubFilter[];
  labels: HubLabel[];
  taskCountsByLabel?: Record<string, number>;
  onOpenQuickAdd?: () => void;
  layout?: "sidebar" | "page";
  /** When set, sidebar links stay on this project's tasks page with scoped query params. */
  projectId?: string;
};

const MAIN_LINKS = [
  { href: TASKS_TODAY_PATH, label: "Today", icon: Calendar },
  { href: TASKS_UPCOMING_PATH, label: "Upcoming", icon: CalendarRange },
  { href: TASKS_INBOX_PATH, label: "Inbox", icon: Inbox },
] as const;

const FILTER_ICONS: Record<string, LucideIcon> = {
  "my tasks today": ListChecks,
  overdue: AlarmClock,
  "awaiting client": Hourglass,
  design: Palette,
  marketing: Megaphone,
  tech: Code,
};

function filterIconForName(name: string): LucideIcon {
  return FILTER_ICONS[name.trim().toLowerCase()] ?? Filter;
}

function SidebarScrollSection({
  title,
  children,
  ariaLabel,
}: {
  title: string;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <p className="mb-2 px-2.5 text-[0.6875rem] font-medium uppercase tracking-wide text-hub-foreground/40">
        {title}
      </p>
      <div
        className={cn(
          "max-h-[10.5rem] overflow-y-auto overscroll-y-contain rounded-[6px] border border-hub-foreground/10 bg-hub-foreground/[0.02]",
          "[scrollbar-color:rgba(11,11,11,0.18)_transparent] [scrollbar-width:thin]",
        )}
        aria-label={ariaLabel}
      >
        <div className="space-y-0.5 p-1">{children}</div>
      </div>
    </div>
  );
}

function SidebarNavButton({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const { location, navigate } = useTasksNavigation();
  const active = location === href;

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-[6px] px-2.5 text-left text-[0.8125rem] font-medium transition-colors lg:min-h-9",
        active
          ? "bg-hub-espresso text-hub-paper"
          : "text-hub-foreground/65 hover:bg-hub-foreground/[0.04] hover:text-hub-foreground",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}

function SidebarFilterButton({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const { location, navigate } = useTasksNavigation();
  const active = location === href;

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-[5px] px-2 text-left text-[0.8125rem] font-medium transition-colors lg:min-h-9",
        active
          ? "bg-hub-espresso text-hub-paper"
          : "text-hub-foreground/65 hover:bg-hub-foreground/[0.04]",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}

function SidebarTeamButton({
  href,
  label,
  color,
  count,
}: {
  href: string;
  label: string;
  color: string;
  count?: number;
}) {
  const { location, navigate } = useTasksNavigation();
  const active = location === href;

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-[5px] px-2 text-left text-[0.8125rem] font-medium transition-colors lg:min-h-9",
        active
          ? "bg-hub-espresso text-hub-paper"
          : "hover:bg-hub-foreground/[0.04]",
      )}
      style={active ? undefined : { color }}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: active ? "currentColor" : color }}
        aria-hidden
      />
      <span className="truncate">{label}</span>
      {count != null && count > 0 && (
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold tabular-nums",
            active ? "bg-hub-paper/15 text-hub-paper" : "bg-hub-foreground/[0.06]",
          )}
          style={active ? undefined : { color }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function TasksSidebar({
  filters,
  labels,
  taskCountsByLabel,
  layout = "sidebar",
  projectId,
}: TasksSidebarProps) {
  const presetFilters = filters.filter((f) => f.is_preset || f.owner_id == null);
  const teamLabels = labels.filter((l) =>
    (TEAM_LABEL_SLUGS as readonly string[]).includes(l.name),
  );
  const showMainLinks = layout === "sidebar";

  const mainLinks = projectId
    ? [
        {
          href: projectTasksViewPath(projectId, "today"),
          label: "Today",
          icon: Calendar,
        },
        {
          href: projectTasksViewPath(projectId, "upcoming"),
          label: "Upcoming",
          icon: CalendarRange,
        },
      ]
    : MAIN_LINKS;

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-6",
        layout === "sidebar" && "lg:w-52",
      )}
    >
      {showMainLinks ? (
        <nav className="space-y-1" aria-label="Task views">
          {mainLinks.map((link) => (
            <SidebarNavButton
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
            />
          ))}
        </nav>
      ) : null}

      {presetFilters.length > 0 && (
        <SidebarScrollSection title="Filters" ariaLabel="Task filters">
          {presetFilters.map((filter) => {
            const href = projectId
              ? projectTasksFilterPath(projectId, filter.id)
              : tasksFilterPath(filter.id);
            return (
              <SidebarFilterButton
                key={filter.id}
                href={href}
                label={filter.name}
                icon={filterIconForName(filter.name)}
              />
            );
          })}
        </SidebarScrollSection>
      )}

      {teamLabels.length > 0 && (
        <SidebarScrollSection title="Teams" ariaLabel="Team labels">
          {teamLabels.map((label) => {
            const href = projectId
              ? projectTasksLabelPath(projectId, label.name)
              : tasksLabelPath(label.name);
            return (
              <SidebarTeamButton
                key={label.id}
                href={href}
                label={`@${label.name}`}
                color={getTeamLabelColor(label.name)}
                count={taskCountsByLabel?.[label.name.toLowerCase()]}
              />
            );
          })}
        </SidebarScrollSection>
      )}
    </aside>
  );
}
