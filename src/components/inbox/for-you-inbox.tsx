"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PanelLeft } from "lucide-react";

import { ForYouList } from "@/components/inbox/for-you-list";
import { ForYouSidebar } from "@/components/inbox/for-you-sidebar";
import type { SharedProjectNode } from "@/lib/inbox/sidebar-queries";
import type { ForYouItem } from "@/lib/inbox/queries";
import { FOR_YOU_PATH } from "@/lib/routes";
import {
  forYouViewDescription,
  forYouViewTitle,
  type ForYouView,
} from "@/lib/inbox/views";
import { cn } from "@/lib/utils";

type ForYouInboxProps = {
  view: ForYouView;
  items: ForYouItem[];
  itemCounts: {
    inbox: number;
    replies: number;
    assigned: number;
  };
  sharedProjects: SharedProjectNode[];
};

const MOBILE_VIEWS: { id: ForYouView; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "replies", label: "Replies" },
  { id: "assigned", label: "Assigned" },
];

function viewHref(view: ForYouView) {
  return view === "inbox" ? FOR_YOU_PATH : `${FOR_YOU_PATH}?view=${view}`;
}

function ForYouSidebarFallback({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "w-56 shrink-0 border-r border-hub-foreground/8 bg-hub-surface-muted",
        className,
      )}
    />
  );
}

export function ForYouInbox({
  view,
  items,
  itemCounts,
  sharedProjects,
}: ForYouInboxProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  useEffect(() => {
    closeMobileSidebar();
  }, [view, closeMobileSidebar]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobileSidebar();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileSidebarOpen, closeMobileSidebar]);

  const sidebarProps = {
    sharedProjects,
    itemCounts,
    onNavigate: closeMobileSidebar,
  };

  return (
    <div className="flex min-h-0 flex-1">
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close sidebar"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          mobileSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={closeMobileSidebar}
        tabIndex={mobileSidebarOpen ? 0 : -1}
      />

      {/* Desktop sidebar — always visible in flow */}
      <div className="hidden shrink-0 lg:block">
        <Suspense fallback={<ForYouSidebarFallback />}>
          <ForYouSidebar {...sidebarProps} />
        </Suspense>
      </div>

      {/* Mobile drawer — overlays content when open */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          mobileSidebarOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none",
        )}
        aria-hidden={!mobileSidebarOpen}
      >
        <Suspense fallback={<ForYouSidebarFallback className="h-full" />}>
          <ForYouSidebar
            {...sidebarProps}
            className="h-full shadow-xl"
            showCloseButton
            onClose={closeMobileSidebar}
          />
        </Suspense>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-hub-paper">
        <div className="border-b border-hub-foreground/8 px-3 py-3 sm:px-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-hub-foreground/10 text-hub-foreground/70 transition-colors hover:bg-hub-foreground/[0.04] hover:text-hub-foreground lg:hidden"
              aria-label="Open sidebar"
              aria-expanded={mobileSidebarOpen}
            >
              <PanelLeft className="size-4" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-extrabold tracking-tight text-hub-foreground sm:text-xl">
                {forYouViewTitle(view)}
              </h1>
              <p className="mt-0.5 hidden text-xs text-hub-foreground/45 sm:block sm:text-sm">
                {forYouViewDescription(view)}
              </p>
            </div>
          </div>

          <nav
            className="mt-3 flex gap-1 overflow-x-auto border-t border-hub-foreground/6 pt-3 lg:hidden"
            aria-label="Inbox views"
          >
            {MOBILE_VIEWS.map((item) => {
              const active = view === item.id;
              const count = itemCounts[item.id];

              return (
                <Link
                  key={item.id}
                  href={viewHref(item.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-hub-foreground/8 text-hub-foreground"
                      : "text-hub-foreground/60 hover:bg-hub-foreground/[0.04] hover:text-hub-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                  {count > 0 && (
                    <span className="text-xs tabular-nums text-hub-foreground/45">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ForYouList items={items} view={view} />
        </div>
      </div>
    </div>
  );
}
