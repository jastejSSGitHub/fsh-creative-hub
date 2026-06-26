"use client";

import { Suspense } from "react";

import { ForYouList } from "@/components/inbox/for-you-list";
import { ForYouSidebar } from "@/components/inbox/for-you-sidebar";
import type { SharedProjectNode } from "@/lib/inbox/sidebar-queries";
import type { ForYouItem } from "@/lib/inbox/queries";
import {
  forYouViewDescription,
  forYouViewTitle,
  type ForYouView,
} from "@/lib/inbox/views";

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

export function ForYouInbox({
  view,
  items,
  itemCounts,
  sharedProjects,
}: ForYouInboxProps) {
  return (
    <div className="flex min-h-[calc(100vh-2.75rem)]">
      <Suspense fallback={<aside className="w-56 shrink-0 border-r border-hub-foreground/8 bg-hub-surface-muted" />}>
        <ForYouSidebar sharedProjects={sharedProjects} itemCounts={itemCounts} />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col bg-hub-paper">
        <div className="border-b border-hub-foreground/8 px-4 py-3 sm:px-6">
          <h1 className="font-display text-lg font-extrabold tracking-tight text-hub-foreground sm:text-xl">
            {forYouViewTitle(view)}
          </h1>
          <p className="mt-0.5 text-xs text-hub-foreground/45 sm:text-sm">
            {forYouViewDescription(view)}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ForYouList items={items} view={view} />
        </div>
      </div>
    </div>
  );
}
