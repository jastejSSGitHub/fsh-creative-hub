"use client";

import Link, { useLinkStatus } from "next/link";
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

const LINKS = [
  { href: TASKS_TODAY_PATH, label: "Today", icon: Calendar },
  { href: TASKS_UPCOMING_PATH, label: "Upcoming", icon: CalendarRange },
  { href: TASKS_INBOX_PATH, label: "Inbox", icon: Inbox },
  { href: TASKS_PATH, label: "Browse", icon: Search },
] as const;

function BottomNavLinkContent({
  label,
  icon: Icon,
  active,
}: {
  label: string;
  icon: typeof Calendar;
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      <Icon
        className={cn("size-5", pending && !active && "animate-pulse")}
        aria-hidden
      />
      {label}
    </>
  );
}

export function TasksBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hub-foreground/10 bg-hub-paper/95 backdrop-blur-md lg:hidden"
      aria-label="Tasks mobile navigation"
    >
      <div className="grid grid-cols-4">
        {LINKS.map((link) => {
          const active =
            link.href === TASKS_PATH
              ? isTasksBrowsePath(pathname ?? "")
              : pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              scroll={false}
              prefetch
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.625rem] font-medium",
                active ? "text-hub-primary" : "text-hub-foreground/50",
              )}
            >
              <BottomNavLinkContent label={link.label} icon={link.icon} active={active} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
