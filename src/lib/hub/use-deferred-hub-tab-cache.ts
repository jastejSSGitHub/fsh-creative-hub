"use client";

import { useEffect, useState } from "react";

import { readHubTabCache, type HubTabCacheKey } from "@/lib/hub/tab-cache";

/**
 * Reads session tab cache only after mount so SSR and the first client render match.
 */
export function useDeferredHubTabCache<T>(key: HubTabCacheKey): T | null {
  const [cached, setCached] = useState<T | null>(null);

  useEffect(() => {
    setCached(readHubTabCache<T>(key));
  }, [key]);

  return cached;
}
