"use client";

import { Building2, Globe, Lock } from "lucide-react";

import type { TaskVisibility } from "@/lib/tasks/visibility";
import { VISIBILITY_LABELS } from "@/lib/tasks/visibility";
import { cn } from "@/lib/utils";

type TaskVisibilityBadgeProps = {
  visibility: TaskVisibility;
  className?: string;
  size?: "sm" | "md";
};

const ICONS = {
  personal: Lock,
  project: Building2,
  team: Globe,
} as const;

export function TaskVisibilityBadge({
  visibility,
  className,
  size = "sm",
}: TaskVisibilityBadgeProps) {
  const Icon = ICONS[visibility];
  const label = VISIBILITY_LABELS[visibility];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border font-mono font-semibold uppercase tracking-[0.06em]",
        size === "sm" ? "px-1.5 py-0.5 text-[0.5rem]" : "px-2 py-0.5 text-[0.5625rem]",
        visibility === "personal" && "border-hub-foreground/15 bg-hub-foreground/[0.04] text-hub-foreground/50",
        visibility === "project" && "border-hub-primary/25 bg-hub-primary/10 text-hub-primary",
        visibility === "team" && "border-hub-final/40 bg-hub-final/15 text-hub-foreground/70",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-2.5" : "size-3"} aria-hidden />
      {label}
    </span>
  );
}
