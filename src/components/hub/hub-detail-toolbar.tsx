"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type HubDetailToolbarContextValue = {
  content: ReactNode | null;
  setContent: (content: ReactNode | null) => void;
};

const HubDetailToolbarContext = createContext<HubDetailToolbarContextValue | null>(
  null,
);

export function HubDetailToolbarProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<ReactNode | null>(null);
  const setContent = useCallback((next: ReactNode | null) => {
    setContentState(next);
  }, []);

  return (
    <HubDetailToolbarContext.Provider value={{ content, setContent }}>
      {children}
    </HubDetailToolbarContext.Provider>
  );
}

export function HubDetailToolbarSlot() {
  const ctx = useContext(HubDetailToolbarContext);
  return ctx?.content ?? null;
}

export function useHubDetailToolbarHasContent(): boolean {
  const ctx = useContext(HubDetailToolbarContext);
  return ctx?.content != null;
}

/** Renders in the page body but displays toolbar actions in the hub header. */
export function HubDetailToolbar({ children }: { children: ReactNode }) {
  const setContent = useContext(HubDetailToolbarContext)?.setContent;

  useEffect(() => {
    if (!setContent) return;
    setContent(children);
    return () => setContent(null);
  }, [children, setContent]);

  return null;
}
