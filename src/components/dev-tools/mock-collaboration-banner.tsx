"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { useDevTools } from "@/lib/dev-tools/dev-tools-context";
import { getMockSharePreviewPaths } from "@/lib/dev-tools/mock-collaboration-data";
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

  const sharePreviews = getMockSharePreviewPaths();

  return (
    <div
      className={cn(
        "border-b border-hub-primary/20 bg-gradient-to-r from-hub-primary/10 via-hub-final/10 to-hub-primary/10 px-4 py-2",
        className,
      )}
      role="status"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 shrink-0 text-hub-primary" aria-hidden />
          <p className="text-xs font-medium text-hub-foreground/75">
            <span className="font-semibold text-hub-foreground">Demo mode</span>
            {" — "}
            mock tasks, For You, share links &amp; Blenz review board. Not real data.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {sharePreviews.map((preview) => (
            <Link
              key={preview.path}
              href={preview.path}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-hub-foreground/12 bg-hub-paper/90 px-2 py-1 text-[0.6875rem] font-medium text-hub-primary transition-colors hover:bg-hub-paper"
            >
              Preview {preview.label.toLowerCase()}
            </Link>
          ))}
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
      </div>
    </div>
  );
}
