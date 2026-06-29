"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { HUB_TAB_PREFETCH_HREFS } from "@/components/hub/hub-tab-navigation-provider";

export function HubTabPrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const run = () => {
      for (const href of HUB_TAB_PREFETCH_HREFS) {
        router.prefetch(href);
      }
    };

    const idleWindow = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions,
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(run, { timeout: 2_000 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(run, 400);
    return () => window.clearTimeout(timer);
  }, [router]);

  return null;
}
