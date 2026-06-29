"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ToastKind = "code" | "text";

type DocsToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const DocsToastContext = createContext<DocsToastContextValue | null>(null);

export function useDocsToast() {
  const ctx = useContext(DocsToastContext);
  if (!ctx) {
    throw new Error("useDocsToast must be used within DocsToastProvider");
  }
  return ctx;
}

type DocsToastProviderProps = {
  children: ReactNode;
};

export function DocsToastProvider({ children }: DocsToastProviderProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((text: string, _kind: ToastKind = "code") => {
    setMessage(text);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, [visible]);

  return (
    <DocsToastContext.Provider value={{ showToast }}>
      {children}
      {message && visible ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "pointer-events-none fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
          )}
        >
          <div className="flex items-center gap-2 rounded-[10px] border border-hub-foreground/10 bg-hub-espresso px-4 py-3 text-sm font-medium text-white shadow-xl">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-hub-approved/20 text-hub-approved">
              ✓
            </span>
            {message}
          </div>
        </div>
      ) : null}
    </DocsToastContext.Provider>
  );
}
