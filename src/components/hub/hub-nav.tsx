"use client";

import Link, { useLinkStatus } from "next/link";

import {
  useHubTabNavigation,
  type HubRootTab,
} from "@/components/hub/hub-tab-navigation-provider";
import { FOR_YOU_PATH, PROJECTS_PATH, TASKS_TODAY_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubNavProps = {
  forYouCount: number;
};

const NAV_ITEMS: {
  href: string;
  label: string;
  tab: HubRootTab;
  badge?: boolean;
}[] = [
  {
    href: PROJECTS_PATH,
    label: "Projects",
    tab: "projects",
  },
  {
    href: TASKS_TODAY_PATH,
    label: "Tasks",
    tab: "tasks",
  },
  {
    href: FOR_YOU_PATH,
    label: "For you",
    tab: "for-you",
    badge: true,
  },
];

function HubNavLinkContent({
  label,
  active,
  showBadge,
  forYouCount,
}: {
  label: string;
  active: boolean;
  showBadge: boolean;
  forYouCount: number;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span className={cn(pending && !active && "opacity-90")}>{label}</span>
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
    </>
  );
}

function HubNavLink({
  href,
  label,
  active,
  showBadge,
  forYouCount,
  onNavigate,
}: {
  href: string;
  label: string;
  tab: HubRootTab;
  active: boolean;
  showBadge: boolean;
  forYouCount: number;
  onNavigate: (href: string) => void;
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={() => onNavigate(href)}
      className={cn(
        "relative inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-[0.8125rem] font-medium transition-all duration-150",
        active
          ? "bg-white/12 text-white"
          : "text-white/55 hover:bg-white/6 hover:text-white/90",
      )}
      aria-current={active ? "page" : undefined}
    >
      <HubNavLinkContent
        label={label}
        active={active}
        showBadge={showBadge}
        forYouCount={forYouCount}
      />
    </Link>
  );
}

export function HubNav({ forYouCount }: HubNavProps) {
  const { activeTab, beginTabNavigation } = useHubTabNavigation();

  return (
    <nav
      className="flex shrink-0 items-center gap-0.5"
      aria-label="Hub navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = activeTab === item.tab;
        const showBadge = Boolean(item.badge) && forYouCount > 0;

        return (
          <HubNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            tab={item.tab}
            active={active}
            showBadge={showBadge}
            forYouCount={forYouCount}
            onNavigate={beginTabNavigation}
          />
        );
      })}
    </nav>
  );
}
