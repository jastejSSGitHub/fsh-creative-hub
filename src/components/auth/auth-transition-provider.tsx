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
import type { AuthTransitionKind } from "@/lib/auth/transition-stages";
import { LANDING_PATH, LOGIN_PATH, PROJECTS_PATH } from "@/lib/routes";

const AUTH_CALLBACK_PATH = "/auth/callback";

type AuthTransitionContextValue = {
  beginAuthTransition: (
    kind: AuthTransitionKind,
    options?: { persist?: boolean },
  ) => void;
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
  const [kind, setKind] = useState<AuthTransitionKind | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const beginAuthTransition = useCallback(
    (nextKind: AuthTransitionKind, options?: { persist?: boolean }) => {
      const now = Date.now();
      setKind(nextKind);
      setStartedAt(now);
      if (options?.persist !== false) {
        persistAuthTransition(nextKind);
      }
    },
    [],
  );

  const endAuthTransition = useCallback(() => {
    setKind(null);
    setStartedAt(null);
    clearAuthTransition();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;

    if (path === LANDING_PATH) {
      clearAuthTransition();
      return;
    }

    const stored = readAuthTransition();
    if (!stored?.kind) return;

    if (path === LOGIN_PATH) {
      if (stored.kind === "enter-hub" || stored.kind === "open-hub") {
        setKind(stored.kind);
        setStartedAt(stored.startedAt);
      } else {
        clearAuthTransition();
      }
      return;
    }

    setKind(stored.kind);
    setStartedAt(stored.startedAt);
  }, []);

  useEffect(() => {
    if (!kind) return;

    if (pathname === AUTH_CALLBACK_PATH && kind === "complete-sign-in") {
      return;
    }

    if (pathname === LANDING_PATH) {
      endAuthTransition();
      return;
    }

    if (pathname === LOGIN_PATH) {
      if (kind === "enter-hub") {
        const timer = window.setTimeout(() => {
          endAuthTransition();
        }, 160);
        return () => window.clearTimeout(timer);
      }

      endAuthTransition();
      return;
    }

    if (isHubDestination(pathname)) {
      const timer = window.setTimeout(() => {
        endAuthTransition();
      }, 480);
      return () => window.clearTimeout(timer);
    }
  }, [endAuthTransition, kind, pathname]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      if (pathname === LANDING_PATH || pathname === LOGIN_PATH) {
        endAuthTransition();
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [endAuthTransition, pathname]);

  const value = useMemo(
    () => ({
      beginAuthTransition,
      endAuthTransition,
      isAuthTransitioning: kind !== null,
    }),
    [beginAuthTransition, endAuthTransition, kind],
  );

  return (
    <AuthTransitionContext.Provider value={value}>
      {children}
      <AuthTransitionOverlay
        visible={kind !== null}
        kind={kind}
        startedAt={startedAt}
      />
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
