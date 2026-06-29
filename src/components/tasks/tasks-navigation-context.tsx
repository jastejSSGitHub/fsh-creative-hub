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
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TasksNavigationContextValue = {
  /** Full path including search string, used for sidebar active state. */
  location: string;
  /** Pathname only (no query), for global task route matching. */
  pathname: string;
  navigate: (href: string) => void;
};

const TasksNavigationContext = createContext<TasksNavigationContextValue | null>(null);

export function TasksNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const nextPathname = usePathname();
  const searchParams = useSearchParams();
  const canonicalLocation = useMemo(() => {
    const search = searchParams.toString();
    return nextPathname + (search ? `?${search}` : "");
  }, [nextPathname, searchParams]);

  const [optimisticLocation, setOptimisticLocation] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticLocation(null);
  }, [canonicalLocation]);

  const location = optimisticLocation ?? canonicalLocation;
  const pathname = location.split("?")[0] ?? location;

  const navigate = useCallback(
    (href: string) => {
      if (location === href) return;

      setOptimisticLocation(href);
      router.push(href);
    },
    [router, location],
  );

  return (
    <TasksNavigationContext.Provider value={{ location, pathname, navigate }}>
      {children}
    </TasksNavigationContext.Provider>
  );
}

export function useTasksNavigation() {
  const context = useContext(TasksNavigationContext);
  if (!context) {
    throw new Error("useTasksNavigation must be used within TasksNavigationProvider");
  }
  return context;
}
