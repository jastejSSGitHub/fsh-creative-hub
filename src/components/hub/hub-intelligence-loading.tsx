"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { BuildProgressEvent } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils";

const MIN_DISPLAY_MS = 500;

type HubIntelligenceLoadingProps = {
  events: BuildProgressEvent[];
  className?: string;
};

export function HubIntelligenceLoading({
  events,
  className,
}: HubIntelligenceLoadingProps) {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), MIN_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    setVisibleIndex(events.length - 1);
  }, [events]);

  const message =
    events[visibleIndex]?.message ?? "Gathering project intelligence…";

  return (
    <div className={cn("px-4 py-6", className)}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2
          className="size-5 animate-spin text-hub-primary"
          aria-hidden
        />
        <p
          className="text-sm font-medium text-hub-foreground/60 transition-opacity duration-300"
          role="status"
          aria-live="polite"
          style={{ opacity: ready ? 1 : 0.6 }}
        >
          {message}
        </p>
        {events.length > 1 && (
          <div className="flex gap-1" aria-hidden>
            {events.map((event, index) => (
              <span
                key={`${event.stage}-${index}`}
                className={cn(
                  "size-1 rounded-full transition-colors",
                  index <= visibleIndex
                    ? "bg-hub-primary"
                    : "bg-hub-foreground/15",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
