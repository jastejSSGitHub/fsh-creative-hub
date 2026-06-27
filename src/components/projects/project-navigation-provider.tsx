"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ProjectOpeningOverlay } from "@/components/projects/project-opening-overlay";
import { PROJECT_OPENING_MIN_VISIBLE_MS } from "@/lib/projects/navigation-stages";
import {
  PROJECT_NAVIGATION_BEGIN_EVENT,
  PROJECT_NAVIGATION_END_EVENT,
} from "@/lib/projects/project-navigation-events";
import type { ProjectNavigationSnapshot } from "@/lib/projects/project-navigation-snapshot";

type ActiveNavigation = ProjectNavigationSnapshot & {
  startedAt: number;
};

export function ProjectNavigationProvider({ children }: { children: ReactNode }) {
  const [activeNav, setActiveNav] = useState<ActiveNavigation | null>(null);
  const activeNavRef = useRef<ActiveNavigation | null>(null);
  const endTimerRef = useRef<number | null>(null);

  useEffect(() => {
    function clearEndTimer() {
      if (endTimerRef.current !== null) {
        window.clearTimeout(endTimerRef.current);
        endTimerRef.current = null;
      }
    }

    function handleBegin(event: Event) {
      clearEndTimer();
      const detail = (event as CustomEvent<ProjectNavigationSnapshot>).detail;
      if (!detail?.projectId) return;

      const next: ActiveNavigation = {
        ...detail,
        startedAt: Date.now(),
      };
      activeNavRef.current = next;
      setActiveNav(next);
    }

    function handleEnd() {
      const current = activeNavRef.current;
      if (!current) return;

      clearEndTimer();

      const elapsed = Date.now() - current.startedAt;
      const delay = Math.max(0, PROJECT_OPENING_MIN_VISIBLE_MS - elapsed);

      endTimerRef.current = window.setTimeout(() => {
        activeNavRef.current = null;
        setActiveNav(null);
        endTimerRef.current = null;
      }, delay);
    }

    window.addEventListener(PROJECT_NAVIGATION_BEGIN_EVENT, handleBegin);
    window.addEventListener(PROJECT_NAVIGATION_END_EVENT, handleEnd);

    return () => {
      clearEndTimer();
      window.removeEventListener(PROJECT_NAVIGATION_BEGIN_EVENT, handleBegin);
      window.removeEventListener(PROJECT_NAVIGATION_END_EVENT, handleEnd);
    };
  }, []);

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
      <ProjectOpeningOverlay
        visible={activeNav !== null}
        projectName={activeNav?.projectName}
        startedAt={activeNav?.startedAt ?? null}
      />
    </>
  );
}
