"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FOR_YOU_PATH, PROJECTS_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubNavProps = {
  forYouCount: number;
};

const NAV_ITEMS = [
  {
    href: PROJECTS_PATH,
    label: "Projects",
    match: (path: string) => path.startsWith(PROJECTS_PATH),
  },
  {
    href: FOR_YOU_PATH,
    label: "For you",
    match: (path: string) => path.startsWith(FOR_YOU_PATH),
    badge: true,
  },
] as const;

export function HubNav({ forYouCount }: HubNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 items-center gap-0.5"
      aria-label="Hub navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const showBadge = "badge" in item && forYouCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-[0.8125rem] font-medium transition-colors",
              active
                ? "bg-white/12 text-white"
                : "text-white/55 hover:bg-white/6 hover:text-white/90",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
            {showBadge && (
              <span
                className={cn(
                  "inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 py-px font-mono text-[0.55rem] font-semibold leading-none",
                  active ? "bg-hub-final text-hub-foreground" : "bg-hub-primary text-white",
                )}
                aria-label={`${forYouCount} unread`}
              >
                {forYouCount > 99 ? "99+" : forYouCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
