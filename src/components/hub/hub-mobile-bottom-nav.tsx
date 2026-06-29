"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, FolderKanban, MessageSquare } from "lucide-react";

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

const LINKS = [
  {
    href: PROJECTS_PATH,
    label: "Projects",
    icon: FolderKanban,
    match: (path: string) =>
      path.startsWith(PROJECTS_PATH) || path.startsWith("/projects/"),
  },
  {
    href: FOR_YOU_PATH,
    label: "For you",
    icon: MessageSquare,
    match: (path: string) => path.startsWith(FOR_YOU_PATH),
    badge: true,
  },
  {
    href: TASKS_TODAY_PATH,
    label: "Tasks",
    icon: CheckSquare,
    match: (path: string) => path.startsWith("/tasks"),
  },
] as const;

function NavLinkContent({
  label,
  icon: Icon,
  active,
  badge,
}: {
  label: string;
  icon: typeof FolderKanban;
  active: boolean;
  badge?: number;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span className="relative">
        <Icon
          className={cn("size-5", pending && !active && "animate-pulse")}
          aria-hidden
        />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 flex min-w-[0.9rem] items-center justify-center rounded-full bg-hub-primary px-0.5 py-px font-mono text-[0.5rem] font-bold leading-none text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      {label}
    </>
  );
}

export function HubMobileBottomNav({ forYouCount }: HubMobileBottomNavProps) {
  const pathname = usePathname() ?? "";

  if (isCanvasPath(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hub-foreground/10 bg-hub-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Hub mobile navigation"
    >
      <div className="grid grid-cols-3">
        {LINKS.map((link) => {
          const active = link.match(pathname);
          const badge = "badge" in link ? forYouCount : undefined;

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
              aria-current={active ? "page" : undefined}
            >
              <NavLinkContent
                label={link.label}
                icon={link.icon}
                active={active}
                badge={badge}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
