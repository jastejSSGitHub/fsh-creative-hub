"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarRange, Inbox, Search } from "lucide-react";

import {
  TASKS_INBOX_PATH,
  TASKS_PATH,
  TASKS_TODAY_PATH,
  TASKS_UPCOMING_PATH,
  isTasksBrowsePath,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

const TABS = [
  { href: TASKS_TODAY_PATH, label: "Today", icon: Calendar },
  { href: TASKS_UPCOMING_PATH, label: "Upcoming", icon: CalendarRange },
  { href: TASKS_INBOX_PATH, label: "Inbox", icon: Inbox },
  { href: TASKS_PATH, label: "Browse", icon: Search },
] as const;

export function TasksMobileViewTabs() {
  const pathname = usePathname() ?? "";

  return (
    <div
      className="mb-4 flex gap-1.5 overflow-x-auto pb-1 lg:hidden"
      role="tablist"
      aria-label="Task views"
    >
      {TABS.map((tab) => {
        const active =
          tab.href === TASKS_PATH
            ? isTasksBrowsePath(pathname)
            : pathname === tab.href;

        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-hub-espresso bg-hub-espresso text-hub-paper"
                : "border-hub-foreground/12 text-hub-foreground/60 hover:border-hub-foreground/20 hover:text-hub-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-3 shrink-0",
                active ? "opacity-90" : "opacity-60",
              )}
              strokeWidth={2}
              aria-hidden
            />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
