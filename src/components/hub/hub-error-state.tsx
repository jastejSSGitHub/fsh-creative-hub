"use client";

import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";
import { FOR_YOU_PATH, PROJECTS_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
};

export function HubErrorState({
  title = "Something went wrong",
  message = "We hit a snag loading this page. Try again or head back to the hub.",
  onRetry,
  homeHref = PROJECTS_PATH,
  homeLabel = "Go to projects",
  className,
}: HubErrorStateProps) {
  useEffect(() => {
    document.title = `${title} · FSH Creative Hub`;
  }, [title]);

  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-hub-foreground/45">
        Creative hub
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-hub-foreground">{title}</h1>
      <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-hub-foreground/60">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "rounded-[6px]")}
          >
            Try again
          </button>
        )}
        <a
          href={homeHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-[6px]")}
        >
          {homeLabel}
        </a>
      </div>
    </div>
  );
}

export function forYouErrorStateProps(): Pick<HubErrorStateProps, "homeHref" | "homeLabel"> {
  return { homeHref: FOR_YOU_PATH, homeLabel: "Go to For You" };
}
