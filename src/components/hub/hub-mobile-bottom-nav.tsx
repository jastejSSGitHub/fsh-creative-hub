"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, FolderKanban, MessageSquare } from "lucide-react";

import {
  useHubTabNavigation,
  type HubRootTab,
} from "@/components/hub/hub-tab-navigation-provider";
import {
  FOR_YOU_PATH,
  PROJECTS_PATH,
  TASKS_TODAY_PATH,
  isCanvasPath,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubMobileBottomNavProps = {
  forYouCount: number;
};

const LINKS: {
  href: string;
  label: string;
  tab: HubRootTab;
  icon: typeof FolderKanban;
  badge?: boolean;
}[] = [
  {
    href: PROJECTS_PATH,
    label: "Projects",
    tab: "projects",
    icon: FolderKanban,
  },
  {
    href: FOR_YOU_PATH,
    label: "For you",
    tab: "for-you",
    icon: MessageSquare,
    badge: true,
  },
  {
    href: TASKS_TODAY_PATH,
    label: "Tasks",
    tab: "tasks",
    icon: CheckSquare,
  },
];

export function HubMobileBottomNav({ forYouCount }: HubMobileBottomNavProps) {
  const pathname = usePathname() ?? "";
  const { activeTab, beginTabNavigation } = useHubTabNavigation();

  if (isCanvasPath(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hub-foreground/10 bg-hub-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Hub mobile navigation"
    >
      <div className="grid grid-cols-3">
        {LINKS.map((link) => {
          const active = activeTab === link.tab;
          const badge = link.badge ? forYouCount : undefined;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              scroll={false}
              prefetch
              onClick={() => beginTabNavigation(link.href)}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.625rem] font-medium transition-colors duration-150",
                "active:scale-[0.97]",
                active ? "text-hub-primary" : "text-hub-foreground/50",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span
                  className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-hub-primary"
                  aria-hidden
                />
              )}
              <span className="relative">
                <Icon className="size-5" aria-hidden />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex min-w-[0.9rem] items-center justify-center rounded-full bg-hub-primary px-0.5 py-px font-mono text-[0.5rem] font-bold leading-none text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
