"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { FileImage } from "lucide-react";

import {
  AssetMediaPreview,
  inferAssetMediaType,
} from "@/components/workspace/asset-media-preview";
import type { ForYouNavigationTarget } from "@/lib/inbox/navigation-targets";
import { cn } from "@/lib/utils";

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 160;

type ForYouHoverCardProps = {
  target: ForYouNavigationTarget;
  children: ReactNode;
  className?: string;
  onNavigate?: (href: string) => void;
};

export function ForYouHoverCard({
  target,
  children,
  className,
  onNavigate,
}: ForYouHoverCardProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = 220;
    const gap = 8;
    const viewportPadding = 12;

    let left = rect.left;
    left = Math.min(
      Math.max(viewportPadding, left),
      window.innerWidth - panelWidth - viewportPadding,
    );

    setCoords({
      top: rect.bottom + gap,
      left,
    });
  }, []);

  const scheduleOpen = useCallback(() => {
    clearTimers();
    openTimerRef.current = window.setTimeout(() => {
      updatePosition();
      setOpen(true);
    }, OPEN_DELAY_MS);
  }, [clearTimers, updatePosition]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, CLOSE_DELAY_MS);
  }, [clearTimers]);

  useEffect(() => {
    if (!open) return;

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => clearTimers, [clearTimers]);

  function handleNavigate(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(target.href);
    setOpen(false);
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex max-w-full", className)}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
      >
        {children}
      </span>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-auto fixed z-[210] w-[13.75rem] overflow-hidden rounded-md border border-hub-foreground/10 bg-hub-paper shadow-[0_10px_28px_rgba(11,11,11,0.14)] animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
          >
            <div className="relative aspect-[16/10] w-full bg-hub-surface-muted">
              {target.thumbnailUrl ? (
                <AssetMediaPreview
                  type={inferAssetMediaType(target.thumbnailUrl)}
                  src={target.thumbnailUrl}
                  alt={target.label}
                  className="size-full"
                  playMode="static"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-hub-foreground/25">
                  <FileImage className="size-5" strokeWidth={1.5} aria-hidden />
                </div>
              )}
            </div>
            <div className="space-y-2 px-2.5 py-2">
              <p className="line-clamp-2 text-xs font-semibold leading-snug text-hub-foreground">
                {target.label}
              </p>
              <Link
                href={target.href}
                onClick={handleNavigate}
                className="inline-flex text-xs font-medium text-hub-primary transition-colors hover:text-[#1590e8]"
              >
                {target.ctaLabel}
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
