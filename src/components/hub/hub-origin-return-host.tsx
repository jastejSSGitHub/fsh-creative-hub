"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useHubTabNavigation } from "@/components/hub/hub-tab-navigation-provider";
import {
  clearHubOriginNavigation,
  readHubOriginNavigation,
  restoreHubOriginScroll,
  type HubOriginNavigation,
} from "@/lib/hub/origin-navigation";
import { FOR_YOU_PATH } from "@/lib/routes";

const TOAST_DURATION_MS = 5000;

function isOnOriginPage(origin: HubOriginNavigation, pathname: string): boolean {
  const returnUrl = new URL(origin.returnPath, "http://local");
  return returnUrl.pathname === pathname;
}

export function HubOriginReturnHost() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { beginTabNavigation } = useHubTabNavigation();
  const [origin, setOrigin] = useState<HubOriginNavigation | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const stored = readHubOriginNavigation();
    if (!stored) {
      setOrigin(null);
      setVisible(false);
      return;
    }

    if (isOnOriginPage(stored, pathname)) {
      clearHubOriginNavigation();
      setOrigin(null);
      setVisible(false);
      return;
    }

    dismissedRef.current = false;
    setOrigin(stored);
    setVisible(true);
  }, [pathname]);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setVisible(false);
    clearHubOriginNavigation();
    setOrigin(null);
  }, []);

  useEffect(() => {
    if (!visible || !origin) {
      setProgress(100);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    function tick(now: number) {
      if (dismissedRef.current) return;

      const elapsed = now - startedAt;
      const remaining = Math.max(0, 1 - elapsed / TOAST_DURATION_MS);
      setProgress(remaining * 100);

      if (elapsed >= TOAST_DURATION_MS) {
        dismiss();
        return;
      }

      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [dismiss, origin, visible]);

  function handleReturn() {
    if (!origin) return;

    const returnPath = origin.returnPath;
    dismissedRef.current = true;
    setVisible(false);

    beginTabNavigation(returnPath.startsWith(FOR_YOU_PATH) ? returnPath : returnPath);

    router.push(returnPath);

    window.requestAnimationFrame(() => {
      restoreHubOriginScroll(origin);
      window.setTimeout(() => restoreHubOriginScroll(origin), 120);
      window.setTimeout(() => restoreHubOriginScroll(origin), 320);
    });

    clearHubOriginNavigation();
    setOrigin(null);
  }

  if (!visible || !origin) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[70] w-[min(92vw,28rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-paper shadow-[0_16px_40px_rgba(11,11,11,0.16)] animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm text-hub-foreground">
          <span className="text-hub-foreground/55">Came from </span>
          <span className="font-medium">{origin.returnLabel}</span>
        </p>
        <button
          type="button"
          onClick={handleReturn}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-hub-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1590e8]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Navigate back
        </button>
      </div>
      <div className="h-0.5 bg-hub-foreground/6">
        <div
          className="h-full bg-hub-primary/70 transition-[width] duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
