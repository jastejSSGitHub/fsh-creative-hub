"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  hubRootTabFromHref,
  hubRootTabFromPathname,
  type HubRootTab,
} from "@/lib/routes";

export type { HubRootTab };

type HubTabNavigationContextValue = {
  pendingTab: HubRootTab | null;
  setPendingTab: (tab: HubRootTab | null) => void;
  beginTabNavigation: (href: string) => void;
  activeTab: HubRootTab;
};

const HubTabNavigationContext =
  createContext<HubTabNavigationContextValue | null>(null);

export function HubTabNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [pendingTab, setPendingTab] = useState<HubRootTab | null>(null);
  const activeTab = pendingTab ?? hubRootTabFromPathname(pathname);

  const beginTabNavigation = useCallback((href: string) => {
    setPendingTab(hubRootTabFromHref(href));
  }, []);

  useEffect(() => {
    setPendingTab(null);
  }, [pathname]);

  const value = useMemo(
    () => ({
      pendingTab,
      setPendingTab,
      beginTabNavigation,
      activeTab,
    }),
    [activeTab, beginTabNavigation, pendingTab],
  );

  return (
    <HubTabNavigationContext.Provider value={value}>
      {children}
    </HubTabNavigationContext.Provider>
  );
}

export function useHubTabNavigation() {
  const context = useContext(HubTabNavigationContext);
  if (!context) {
    throw new Error(
      "useHubTabNavigation must be used within HubTabNavigationProvider",
    );
  }
  return context;
}

export function matchHubRootTab(
  tab: HubRootTab,
  pathname: string,
): boolean {
  return hubRootTabFromPathname(pathname) === tab;
}
