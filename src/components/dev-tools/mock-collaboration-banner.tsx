"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { useDevTools } from "@/lib/dev-tools/dev-tools-context";
import { DEV_TOOLS_MOCK_COLLABORATION_CHANGED } from "@/lib/dev-tools/events";
import { readMockCollaborationData } from "@/lib/dev-tools/storage";
import { cn } from "@/lib/utils";

type MockCollaborationBannerProps = {
  className?: string;
};

export function MockCollaborationBanner({ className }: MockCollaborationBannerProps) {
  const devTools = useDevTools();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readMockCollaborationData());

    function onChanged(event: Event) {
      const detail = (event as CustomEvent<{ enabled: boolean }>).detail;
      setEnabled(detail?.enabled ?? readMockCollaborationData());
    }

    window.addEventListener(DEV_TOOLS_MOCK_COLLABORATION_CHANGED, onChanged);
    return () =>
      window.removeEventListener(DEV_TOOLS_MOCK_COLLABORATION_CHANGED, onChanged);
  }, []);

  if (!enabled) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 border-b border-hub-primary/20 bg-gradient-to-r from-hub-primary/10 via-hub-final/10 to-hub-primary/10 px-4 py-2 text-center",
        className,
      )}
      role="status"
    >
      <Sparkles className="size-3.5 shrink-0 text-hub-primary" aria-hidden />
      <p className="text-xs font-medium text-hub-foreground/75">
        <span className="font-semibold text-hub-foreground">Demo mode</span>
        {" — "}
        mock tasks, mentions, and For You items. Not real project data.
      </p>
      {devTools && (
        <button
          type="button"
          onClick={() => devTools.setMockCollaborationData(false)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-hub-foreground/15 bg-hub-paper/80 px-2 py-1 text-[0.6875rem] font-medium text-hub-foreground/80 transition-colors hover:bg-hub-paper hover:text-hub-foreground"
        >
          <X className="size-3" aria-hidden />
          Exit demo
        </button>
      )}
    </div>
  );
}
