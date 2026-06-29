"use client";

import { ForYouInbox } from "@/components/inbox/for-you-inbox";
import { ForYouInboxSkeleton } from "@/components/inbox/for-you-inbox-skeleton";
import { filterForYouByLens } from "@/lib/inbox/lenses";
import { useDeferredHubTabCache } from "@/lib/hub/use-deferred-hub-tab-cache";
import type { SharedProjectNode } from "@/lib/inbox/sidebar-queries";
import type { ForYouItem } from "@/lib/inbox/queries";
import type { ForYouLens } from "@/lib/routes";

type ForYouTabCache = {
  lens: ForYouLens;
  allItems: ForYouItem[];
  items: ForYouItem[];
  itemCounts: Record<ForYouLens, number>;
  sharedProjects: SharedProjectNode[];
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string | null;
};

type ForYouPageFallbackProps = {
  lens: ForYouLens;
};

export function ForYouPageFallback({ lens }: ForYouPageFallbackProps) {
  const cached = useDeferredHubTabCache<ForYouTabCache>("for-you");

  if (cached?.allItems) {
    const items = filterForYouByLens(cached.allItems, lens, cached.userId);

    return (
      <ForYouInbox
        lens={lens}
        allItems={cached.allItems}
        items={items}
        itemCounts={cached.itemCounts}
        sharedProjects={cached.sharedProjects}
        userId={cached.userId}
        userDisplayName={cached.userDisplayName}
        userAvatarUrl={cached.userAvatarUrl}
      />
    );
  }

  return <ForYouInboxSkeleton />;
}
