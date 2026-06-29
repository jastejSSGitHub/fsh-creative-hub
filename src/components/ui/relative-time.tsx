"use client";

import { useEffect, useState } from "react";

import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";

type RelativeTimeProps = {
  iso: string;
  className?: string;
};

/**
 * Renders relative timestamps after mount to avoid SSR/client clock drift mismatches.
 */
export function RelativeTime({ iso, className }: RelativeTimeProps) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatRelativeTime(iso));
  }, [iso]);

  return (
    <span className={cn(className)} suppressHydrationWarning>
      {label ?? "\u00a0"}
    </span>
  );
}
