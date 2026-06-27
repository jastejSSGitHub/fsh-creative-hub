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

type BeginAuthTransitionOptions = {
  persist?: boolean;
  firstName?: string;
};

type AuthTransitionContextValue = {
  beginAuthTransition: (
    kind: AuthTransitionKind,
    options?: BeginAuthTransitionOptions,
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

function hasOAuthCodeInUrl() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("code");
}

export function AuthTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [kind, setKind] = useState<AuthTransitionKind | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string | undefined>();

  const beginAuthTransition = useCallback(
    (nextKind: AuthTransitionKind, options?: BeginAuthTransitionOptions) => {
      const now = Date.now();
      setKind(nextKind);
      setStartedAt(now);
      setFirstName(options?.firstName);

      if (options?.persist !== false) {
        persistAuthTransition(nextKind, {
          firstName: options?.firstName,
        });
      }
    },
    [],
  );

  const endAuthTransition = useCallback(() => {
    setKind(null);
    setStartedAt(null);
    setFirstName(undefined);
    clearAuthTransition();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;

    if (path === LANDING_PATH) {
      if (hasOAuthCodeInUrl()) return;
      clearAuthTransition();
      return;
    }

    const stored = readAuthTransition();
    if (!stored?.kind) return;

    if (path === LOGIN_PATH) {
      if (
        stored.kind === "enter-hub" ||
        stored.kind === "open-hub" ||
        stored.kind === "welcome-sign-in"
      ) {
        setKind(stored.kind);
        setStartedAt(stored.startedAt);
        setFirstName(stored.firstName);
      } else {
        clearAuthTransition();
      }
      return;
    }

    setKind(stored.kind);
    setStartedAt(stored.startedAt);
    setFirstName(stored.firstName);
  }, []);

  useEffect(() => {
    if (!kind) return;

    if (
      pathname === AUTH_CALLBACK_PATH &&
      (kind === "complete-sign-in" || kind === "welcome-sign-in")
    ) {
      return;
    }

    if (pathname === LANDING_PATH) {
      if (hasOAuthCodeInUrl()) return;
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
      const delay = kind === "welcome-sign-in" ? 1_100 : 480;
      const timer = window.setTimeout(() => {
        endAuthTransition();
      }, delay);
      return () => window.clearTimeout(timer);
    }
  }, [endAuthTransition, kind, pathname]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      if (pathname === LANDING_PATH || pathname === LOGIN_PATH) {
        if (hasOAuthCodeInUrl()) return;
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
        firstName={firstName}
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
