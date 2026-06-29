"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  TASKS_INBOX_PATH,
  TASKS_PATH,
  TASKS_TODAY_PATH,
  TASKS_UPCOMING_PATH,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

const TABS = [
  { href: TASKS_TODAY_PATH, label: "Today" },
  { href: TASKS_UPCOMING_PATH, label: "Upcoming" },
  { href: TASKS_INBOX_PATH, label: "Inbox" },
  { href: TASKS_PATH, label: "Browse" },
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
          pathname === tab.href ||
          (tab.href === TASKS_PATH &&
            pathname.startsWith("/tasks") &&
            pathname !== TASKS_TODAY_PATH &&
            pathname !== TASKS_UPCOMING_PATH &&
            pathname !== TASKS_INBOX_PATH);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-hub-espresso bg-hub-espresso text-hub-paper"
                : "border-hub-foreground/12 text-hub-foreground/60 hover:border-hub-foreground/20 hover:text-hub-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
