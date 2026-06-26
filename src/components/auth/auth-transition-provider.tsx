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

import { AuthTransitionOverlay } from "@/components/auth/auth-transition-overlay";
import {
  clearAuthTransition,
  persistAuthTransition,
  readAuthTransition,
} from "@/lib/auth/transition-storage";
import { LOGIN_PATH, PROJECTS_PATH } from "@/lib/routes";

type AuthTransitionContextValue = {
  beginAuthTransition: (label: string, options?: { persist?: boolean }) => void;
  endAuthTransition: () => void;
  isAuthTransitioning: boolean;
};

const AuthTransitionContext = createContext<AuthTransitionContextValue | null>(
  null,
);

const HUB_DESTINATION_PREFIXES = [PROJECTS_PATH, "/for-you"];

function isHubDestination(pathname: string) {
  return HUB_DESTINATION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AuthTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [label, setLabel] = useState<string | null>(null);

  const beginAuthTransition = useCallback(
    (nextLabel: string, options?: { persist?: boolean }) => {
      setLabel(nextLabel);
      if (options?.persist !== false) {
        persistAuthTransition(nextLabel);
      }
    },
    [],
  );

  const endAuthTransition = useCallback(() => {
    setLabel(null);
    clearAuthTransition();
  }, []);

  useEffect(() => {
    const stored = readAuthTransition();
    if (stored?.label) {
      setLabel(stored.label);
    }
  }, []);

  useEffect(() => {
    if (!label) return;

    if (pathname === LOGIN_PATH) {
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      if (params?.get("error")) {
        endAuthTransition();
        return;
      }

      if (label === "Loading…") {
        const timer = window.setTimeout(() => {
          endAuthTransition();
        }, 160);
        return () => window.clearTimeout(timer);
      }
    }

    if (isHubDestination(pathname)) {
      const timer = window.setTimeout(() => {
        endAuthTransition();
      }, 480);
      return () => window.clearTimeout(timer);
    }
  }, [endAuthTransition, label, pathname]);

  const value = useMemo(
    () => ({
      beginAuthTransition,
      endAuthTransition,
      isAuthTransitioning: label !== null,
    }),
    [beginAuthTransition, endAuthTransition, label],
  );

  return (
    <AuthTransitionContext.Provider value={value}>
      {children}
      <AuthTransitionOverlay visible={label !== null} label={label ?? ""} />
    </AuthTransitionContext.Provider>
  );
}

export function useAuthTransition() {
  const context = useContext(AuthTransitionContext);
  if (!context) {
    throw new Error("useAuthTransition must be used within AuthTransitionProvider");
  }
  return context;
}
