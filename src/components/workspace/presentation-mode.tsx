"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { STATUS_STYLES } from "@/components/workspace/asset-status";
import { PresentationImageViewer } from "@/components/workspace/presentation-image-viewer";
import type { AssetWithVotes } from "@/lib/workspace/queries";
import type { AssetStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type PresentationModeProps = {
  assets: AssetWithVotes[];
  initiativeName?: string;
  projectName?: string;
  initialIndex?: number;
  onClose: () => void;
};

const SWIPE_THRESHOLD_PX = 48;
const CHROME_HIDE_MS = 3200;

const PRESENTATION_STATUS_BADGE: Record<AssetStatus, string> = {
  pending: "border-white/25 bg-white/10 text-white/80",
  approved: "border-hub-approved/45 bg-hub-approved/35 text-white",
  rejected: "border-hub-rejected/45 bg-hub-rejected/35 text-white",
  final: "border-hub-final/50 bg-hub-final/40 text-white",
};

const SIDE_NAV_BUTTON_CLASS =
  "pointer-events-auto absolute top-1/2 z-30 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[opacity,background-color,transform] duration-300 hover:scale-[1.03] hover:bg-white/15 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-25 sm:size-12";

export function PresentationMode({
  assets,
  initiativeName,
  projectName,
  initialIndex = 0,
  onClose,
}: PresentationModeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(initialIndex);
  const [chromeVisible, setChromeVisible] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const asset = assets[index];
  const status = asset ? STATUS_STYLES[asset.status] : null;

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(current + 1, assets.length - 1));
  }, [assets.length]);

  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(current - 1, 0));
  }, []);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setChromeVisible(false);
    }, CHROME_HIDE_MS);
  }, []);

  useEffect(() => {
    revealChrome();
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, [revealChrome]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goNext();
        revealChrome();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        revealChrome();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goNext, goPrev, onClose, revealChrome]);

  useEffect(() => {
    revealChrome();
  }, [index, revealChrome]);

  if (!asset) return null;

  function handleVideoTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    revealChrome();
  }

  function handleVideoTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    if (delta > SWIPE_THRESHOLD_PX) goPrev();
    else if (delta < -SWIPE_THRESHOLD_PX) goNext();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Presentation mode"
      onMouseMove={revealChrome}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-300 sm:px-6",
          chromeVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="pointer-events-auto flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-mono text-[0.6rem] uppercase tracking-[0.16em] text-white/45">
              {[projectName, initiativeName].filter(Boolean).join(" · ")}
            </p>
            <p className="truncate font-display text-sm font-bold text-white sm:text-base">
              {asset.name}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-white/50">
                {asset.tag}
              </span>
              {status && (
                <span
                  className={cn(
                    "rounded-sm border px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.1em]",
                    PRESENTATION_STATUS_BADGE[asset.status],
                  )}
                >
                  {status.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.14em] text-white/45 sm:inline">
              {index + 1} / {assets.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close presentation"
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:scale-95"
            >
              <X className="size-[1.125rem]" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        disabled={index === 0}
        onClick={() => {
          goPrev();
          revealChrome();
        }}
        className={cn(
          SIDE_NAV_BUTTON_CLASS,
          "left-[max(0.75rem,env(safe-area-inset-left))]",
          chromeVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <ChevronLeft className="size-6 sm:size-7" strokeWidth={2.25} aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        disabled={index >= assets.length - 1}
        onClick={() => {
          goNext();
          revealChrome();
        }}
        className={cn(
          SIDE_NAV_BUTTON_CLASS,
          "right-[max(0.75rem,env(safe-area-inset-right))]",
          chromeVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <ChevronRight className="size-6 sm:size-7" strokeWidth={2.25} aria-hidden />
      </button>

      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        disabled={index === 0}
        onClick={() => {
          goPrev();
          revealChrome();
        }}
        className="absolute inset-y-0 left-0 z-10 hidden w-[min(22%,8rem)] cursor-w-resize disabled:cursor-default sm:block"
      />
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        disabled={index >= assets.length - 1}
        onClick={() => {
          goNext();
          revealChrome();
        }}
        className="absolute inset-y-0 right-0 z-10 hidden w-[min(22%,8rem)] cursor-e-resize disabled:cursor-default sm:block"
      />

      <div className="flex h-full items-center justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-14 sm:px-8 sm:pt-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={asset.id}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-h-full max-w-full items-center justify-center"
          >
            {asset.type === "video" ? (
              <div
                className="flex max-h-full max-w-full items-center justify-center"
                onTouchStart={handleVideoTouchStart}
                onTouchEnd={handleVideoTouchEnd}
              >
                <video
                  key={asset.public_url}
                  src={asset.public_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="max-h-[calc(100dvh-5rem)] max-w-full object-contain"
                />
              </div>
            ) : (
              <PresentationImageViewer
                src={asset.public_url}
                alt={asset.name}
                className="h-[calc(100dvh-6.5rem)] w-[min(100%,calc(100vw-1.5rem))] sm:h-[calc(100dvh-7rem)] sm:w-[min(100%,calc(100vw-6rem))]"
                swipeThresholdPx={SWIPE_THRESHOLD_PX}
                onSwipePrev={() => {
                  goPrev();
                  revealChrome();
                }}
                onSwipeNext={() => {
                  goNext();
                  revealChrome();
                }}
                onInteract={revealChrome}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 transition-opacity duration-300 sm:px-6",
          chromeVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="pointer-events-auto flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            {assets.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${slideIndex + 1}`}
                aria-current={slideIndex === index ? "true" : undefined}
                onClick={() => {
                  setIndex(slideIndex);
                  revealChrome();
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  slideIndex === index
                    ? "w-6 bg-hub-final"
                    : "w-1.5 bg-white/30 hover:bg-white/50",
                )}
              />
            ))}
          </div>

          <p className="text-center font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/35 sm:hidden">
            Pinch or double-tap to zoom · Swipe to navigate · {index + 1} / {assets.length}
          </p>
        </div>
      </div>
    </div>
  );
}
