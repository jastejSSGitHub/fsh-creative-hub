"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type TasksNavigationContextValue = {
  pathname: string;
  navigate: (href: string) => void;
};

const TasksNavigationContext = createContext<TasksNavigationContextValue | null>(null);

export function TasksNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const nextPathname = usePathname();
  const [viewPath, setViewPath] = useState(nextPathname);

  useEffect(() => {
    setViewPath(nextPathname);
  }, [nextPathname]);

  useEffect(() => {
    function handlePopState() {
      setViewPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      if (viewPath === href) return;

      setViewPath(href);
      window.history.pushState(null, "", href);
      router.push(href);
    },
    [router, viewPath],
  );

  return (
    <TasksNavigationContext.Provider value={{ pathname: viewPath, navigate }}>
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
