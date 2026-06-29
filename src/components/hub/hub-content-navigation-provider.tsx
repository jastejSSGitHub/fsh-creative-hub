"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { HubStagedLoadingOverlay } from "@/components/projects/hub-staged-loading-overlay";
import {
  HUB_CONTENT_NAVIGATION_BEGIN_EVENT,
  HUB_CONTENT_NAVIGATION_END_EVENT,
  type HubContentNavigationSnapshot,
} from "@/lib/hub/hub-content-navigation-events";
import {
  HUB_CONTENT_NAVIGATION_MIN_VISIBLE_MS,
  HUB_CONTENT_NAVIGATION_STAGE_MS,
  hubContentNavigationPathname,
} from "@/lib/hub/hub-content-navigation-stages";

type ActiveNavigation = HubContentNavigationSnapshot & {
  startedAt: number;
  targetPathname: string;
  beginPathname: string;
};

function navigationMatchesTarget(
  pathname: string,
  search: string,
  snapshot: ActiveNavigation,
): boolean {
  const current = `${pathname}${search}`;
  if (current === snapshot.href || pathname === snapshot.targetPathname) {
    return true;
  }

  if (snapshot.kind === "asset") {
    const assetMatch = snapshot.href.match(/\/a\/([^/?]+)/);
    const params = new URLSearchParams(search);
    if (assetMatch?.[1] && params.get("asset") === assetMatch[1]) {
      return true;
    }
  }

  if (snapshot.kind === "document" && snapshot.href.includes("block=")) {
    const blockMatch = snapshot.href.match(/[?&]block=([^&]+)/);
    const params = new URLSearchParams(search);
    const blockId = blockMatch?.[1]
      ? decodeURIComponent(blockMatch[1])
      : null;
    if (blockId && params.get("block") === blockId) {
      return true;
    }
    if (pathname === snapshot.targetPathname) {
      return true;
    }
  }

  if (snapshot.kind === "canvas" && snapshot.href.includes("node=")) {
    const nodeMatch = snapshot.href.match(/[?&]node=([^&]+)/);
    const params = new URLSearchParams(search);
    const nodeId = nodeMatch?.[1] ? decodeURIComponent(nodeMatch[1]) : null;
    if (nodeId && params.get("node") === nodeId) {
      return true;
    }
    if (pathname === snapshot.targetPathname) {
      return true;
    }
  }

  if (snapshot.kind === "task" && snapshot.href.includes("task=")) {
    const taskMatch = snapshot.href.match(/[?&]task=([^&]+)/);
    const params = new URLSearchParams(search);
    const taskId = taskMatch?.[1] ? decodeURIComponent(taskMatch[1]) : null;
    if (taskId && params.get("task") === taskId) {
      return true;
    }
  }

  return pathname !== snapshot.beginPathname;
}

export function HubContentNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";
  const [activeNav, setActiveNav] = useState<ActiveNavigation | null>(null);
  const activeNavRef = useRef<ActiveNavigation | null>(null);
  const endTimerRef = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    function clearEndTimer() {
      if (endTimerRef.current !== null) {
        window.clearTimeout(endTimerRef.current);
        endTimerRef.current = null;
      }
    }

    function finishNavigation() {
      const current = activeNavRef.current;
      if (!current) return;

      clearEndTimer();

      const elapsed = Date.now() - current.startedAt;
      const delay = Math.max(0, HUB_CONTENT_NAVIGATION_MIN_VISIBLE_MS - elapsed);

      endTimerRef.current = window.setTimeout(() => {
        activeNavRef.current = null;
        setActiveNav(null);
        endTimerRef.current = null;
      }, delay);
    }

    function handleBegin(event: Event) {
      clearEndTimer();
      const detail = (event as CustomEvent<HubContentNavigationSnapshot>).detail;
      if (!detail?.href) return;

      const next: ActiveNavigation = {
        ...detail,
        startedAt: Date.now(),
        targetPathname: hubContentNavigationPathname(detail.href),
        beginPathname: pathnameRef.current,
      };
      activeNavRef.current = next;
      setActiveNav(next);
    }

    function handleEnd() {
      finishNavigation();
    }

    window.addEventListener(HUB_CONTENT_NAVIGATION_BEGIN_EVENT, handleBegin);
    window.addEventListener(HUB_CONTENT_NAVIGATION_END_EVENT, handleEnd);

    return () => {
      clearEndTimer();
      window.removeEventListener(HUB_CONTENT_NAVIGATION_BEGIN_EVENT, handleBegin);
      window.removeEventListener(HUB_CONTENT_NAVIGATION_END_EVENT, handleEnd);
    };
  }, []);

  useEffect(() => {
    if (!activeNav) return;
    if (!navigationMatchesTarget(pathname, search, activeNav)) return;

    const current = activeNavRef.current;
    if (!current) return;

    const elapsed = Date.now() - current.startedAt;
    const delay = Math.max(0, HUB_CONTENT_NAVIGATION_MIN_VISIBLE_MS - elapsed);

    const timer = window.setTimeout(() => {
      activeNavRef.current = null;
      setActiveNav(null);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeNav, pathname, search]);

  useEffect(() => {
    if (!activeNav) return;

    const safetyTimer = window.setTimeout(() => {
      activeNavRef.current = null;
      setActiveNav(null);
    }, 45_000);

    return () => window.clearTimeout(safetyTimer);
  }, [activeNav]);

  return (
    <>
      {children}
      <HubStagedLoadingOverlay
        visible={activeNav !== null}
        stages={activeNav?.stages ?? ["Loading…"]}
        stageMs={HUB_CONTENT_NAVIGATION_STAGE_MS}
        subtitle={activeNav?.label}
        startedAt={activeNav?.startedAt ?? null}
      />
    </>
  );
}
