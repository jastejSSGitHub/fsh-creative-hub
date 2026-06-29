"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PanelLeft } from "lucide-react";
import { ForYouList } from "@/components/inbox/for-you-list";
import { ForYouSidebar } from "@/components/inbox/for-you-sidebar";
import {
  forYouLensDescription,
  forYouLensTitle,
} from "@/lib/inbox/lenses";
import type { SharedProjectNode } from "@/lib/inbox/sidebar-queries";
import type { ForYouItem } from "@/lib/inbox/queries";
import { forYouLensPath, type ForYouLens } from "@/lib/routes";
import { writeHubTabCache } from "@/lib/hub/tab-cache";
import { cn } from "@/lib/utils";

type ForYouInboxProps = {
  lens: ForYouLens;
  allItems: ForYouItem[];
  items: ForYouItem[];
  itemCounts: Record<ForYouLens, number>;
  sharedProjects: SharedProjectNode[];
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string | null;
};

const MOBILE_LENSES: { id: ForYouLens; label: string }[] = [
  { id: "needs-you", label: "Needs you" },
  { id: "replies", label: "Replies" },
  { id: "assigned", label: "Assigned" },
  { id: "waiting-on-others", label: "Waiting" },
  { id: "following", label: "Following" },
  { id: "your-uploads", label: "Uploads" },
];

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
  lens,
  allItems,
  items,
  itemCounts,
  sharedProjects,
  userId,
  userDisplayName,
  userAvatarUrl = null,
}: ForYouInboxProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    closeMobileSidebar();
  }, [lens, closeMobileSidebar]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        closeMobileSidebar();
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeMobileSidebar]);
  useEffect(() => {
    writeHubTabCache("for-you", {
      lens,
      allItems,
      items,
      itemCounts,
      sharedProjects,
      userId,
      userDisplayName,
      userAvatarUrl,
    });
  }, [
    allItems,
    itemCounts,
    items,
    lens,
    sharedProjects,
    userAvatarUrl,
    userDisplayName,
    userId,
  ]);

  useEffect(() => {
    if (!mounted) return;

    const isMobileDrawer =
      mobileSidebarOpen && window.innerWidth < 1024;

    if (isMobileDrawer) {
      document.body.dataset.hubForYouDrawerOpen = "true";
    } else {
      delete document.body.dataset.hubForYouDrawerOpen;
    }

    return () => {
      delete document.body.dataset.hubForYouDrawerOpen;
    };
  }, [mobileSidebarOpen, mounted]);

  useEffect(() => {
    if (!mobileSidebarOpen || !mounted) return;
    if (window.innerWidth >= 1024) return;

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
  }, [mobileSidebarOpen, mounted, closeMobileSidebar]);

  const sidebarProps = {
    sharedProjects,
    items: allItems,
    userId,
    userDisplayName,
    userAvatarUrl,
    onNavigate: closeMobileSidebar,
  };

  const mobileSidebarDrawer =
    mobileSidebarOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[60] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="For you sidebar"
          >
            <button
              type="button"
              aria-label="Close sidebar"
              className="absolute inset-0 bg-black/50"
              onClick={closeMobileSidebar}
            />
            <div className="absolute inset-y-0 left-0 flex w-56 flex-col bg-hub-surface-muted shadow-2xl">
              <Suspense fallback={<ForYouSidebarFallback className="h-full w-full" />}>
                <ForYouSidebar
                  {...sidebarProps}
                  className="h-full w-full border-r-0"
                  showCloseButton
                  onClose={closeMobileSidebar}
                />
              </Suspense>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex min-h-0 w-full flex-1">
      {/* Desktop sidebar — always visible in flow */}
      <div className="hidden shrink-0 lg:block">
        <Suspense fallback={<ForYouSidebarFallback />}>
          <ForYouSidebar {...sidebarProps} />
        </Suspense>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-hub-paper">
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
                {forYouLensTitle(lens)}
              </h1>
              <p className="mt-0.5 hidden text-xs text-hub-foreground/45 sm:block sm:text-sm">
                {forYouLensDescription(lens)}
              </p>
            </div>
          </div>

          <nav
            className="mt-3 flex gap-1 overflow-x-auto border-t border-hub-foreground/6 pt-3 lg:hidden"
            aria-label="Inbox lenses"
          >
            {MOBILE_LENSES.map((item) => {
              const active = lens === item.id;
              const count = itemCounts[item.id];

              return (
                <Link
                  key={item.id}
                  href={forYouLensPath(item.id)}
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

        <div className="fsh-scroll min-h-0 flex-1 overflow-y-auto pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-6">
          <ForYouList items={items} lens={lens} />
        </div>
      </div>

      {mobileSidebarDrawer}
    </div>
  );
}