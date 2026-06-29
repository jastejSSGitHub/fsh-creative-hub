"use client";

import { Check, ChevronRight } from "lucide-react";

import { ForYouHoverCard } from "@/components/inbox/for-you-hover-card";
import { HubTooltip } from "@/components/ui/hub-tooltip";
import {
  buildForYouNavigationTargets,
  forYouPreviewBody,
  forYouPrimaryTitle,
  type ForYouNavigationTarget,
} from "@/lib/inbox/navigation-targets";
import type { ForYouItem } from "@/lib/inbox/queries";
import { cn } from "@/lib/utils";

type ForYouTargetContextProps = {
  item: ForYouItem;
  onNavigate: (href: string) => void;
  onOpenInContext: () => void;
  onDismiss: () => void;
};

function BreadcrumbSeparator() {
  return (
    <span aria-hidden className="shrink-0 text-hub-foreground/20">
      ·
    </span>
  );
}

function BreadcrumbSegment({
  target,
  onNavigate,
}: {
  target: ForYouNavigationTarget;
  onNavigate: (href: string) => void;
}) {
  return (
    <ForYouHoverCard target={target} onNavigate={onNavigate}>
      <button
        type="button"
        className="max-w-[10rem] truncate rounded-sm px-0.5 text-hub-foreground/50 transition-colors hover:text-hub-primary"
      >
        {target.label}
      </button>
    </ForYouHoverCard>
  );
}

export function ForYouTargetContext({
  item,
  onNavigate,
  onOpenInContext,
  onDismiss,
}: ForYouTargetContextProps) {
  const title = forYouPrimaryTitle(item);
  const previewBody = forYouPreviewBody(item);
  const targets = buildForYouNavigationTargets(item);
  const primaryTarget = targets.find((target) => target.kind === "asset") ?? targets[0];

  return (
    <div
      className={cn(
        "group/target mt-2 inline-flex w-fit max-w-full flex-col rounded-sm border border-transparent transition-colors",
        "px-2.5 py-1.5 -ml-0.5",
        "hover:border-hub-foreground/8 hover:bg-hub-foreground/[0.03]",
      )}
    >
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          {previewBody ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-hub-foreground/75">
              {previewBody}
            </p>
          ) : null}

          {primaryTarget ? (
            <ForYouHoverCard
              target={primaryTarget}
              onNavigate={onNavigate}
              className={cn(previewBody ? "mt-1" : undefined)}
            >
              <span className="block text-sm font-semibold text-hub-foreground">
                {title}
              </span>
            </ForYouHoverCard>
          ) : (
            <span className="block text-sm font-semibold text-hub-foreground">{title}</span>
          )}

          {targets.length > 0 ? (
            <span className="mt-1 flex max-w-full flex-wrap items-center gap-x-1 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-hub-foreground/40">
              {targets.map((target, index) => (
                <span key={target.id} className="inline-flex min-w-0 items-center gap-x-1">
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbSegment target={target} onNavigate={onNavigate} />
                </span>
              ))}
            </span>
          ) : null}

          <button
            type="button"
            onClick={onOpenInContext}
            className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-hub-primary/80 transition-colors hover:text-hub-primary"
          >
            Open in context
            <ChevronRight className="size-3" strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <HubTooltip label="Dismiss from For You" side="top">
          <button
            type="button"
            aria-label="Dismiss from For You"
            onClick={onDismiss}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-hub-foreground/35 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground/70"
          >
            <Check className="size-3.5" strokeWidth={2.25} />
          </button>
        </HubTooltip>
      </div>
    </div>
  );
}
