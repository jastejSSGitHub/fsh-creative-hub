"use client";

import { X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ProjectShareOnboardingCard } from "@/components/project-files/project-onboarding";
import {
  clampCardPosition,
  type CardPosition,
} from "@/lib/project-files/onboarding-positioning";

type ProjectShareOnboardingCardOverlayProps = {
  card: ProjectShareOnboardingCard | null;
  dialogRef: React.RefObject<HTMLDialogElement | null>;
};

export function ProjectShareOnboardingCardOverlay({
  card,
  dialogRef,
}: ProjectShareOnboardingCardOverlayProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CardPosition | null>(null);
  const [mountNode, setMountNode] = useState<HTMLDialogElement | null>(null);

  useLayoutEffect(() => {
    if (!card) {
      setMountNode(null);
      setPosition(null);
      return;
    }

    let cancelled = false;
    let frame = 0;

    function attach() {
      const dialog = dialogRef.current;
      if (!dialog) {
        frame = window.requestAnimationFrame(attach);
        return;
      }
      if (cancelled) return;
      setMountNode(dialog);
    }

    attach();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [card, dialogRef]);

  useLayoutEffect(() => {
    if (!card || !mountNode) {
      setPosition(null);
      return;
    }

    function measure() {
      const dialogEl = dialogRef.current;
      const cardEl = cardRef.current;
      if (!dialogEl) return;

      const dialogRect = dialogEl.getBoundingClientRect();
      const cardWidth = cardEl?.offsetWidth ?? 384;
      const cardHeight = cardEl?.offsetHeight ?? 180;
      setPosition(clampCardPosition(dialogRect, cardWidth, cardHeight, "below"));
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(mountNode);
    if (cardRef.current) observer.observe(cardRef.current);

    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [card, dialogRef, mountNode]);

  if (!card || !mountNode) return null;

  return createPortal(
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        top: position?.top ?? -10000,
        left: position?.left ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
      className="pointer-events-auto relative z-[1] w-[min(92vw,24rem)] rounded-xl bg-[#7c3aed] p-4 pt-8 text-white shadow-2xl"
    >
      {card.onClose && (
        <button
          type="button"
          onClick={card.onClose}
          aria-label="Close onboarding"
          className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      )}
      <p className="font-mono text-[0.6rem] uppercase tracking-wider text-white/60">
        {card.stepLabel}
      </p>
      <p className="mt-1 font-display text-base font-extrabold">{card.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/85">{card.body}</p>
      <div className="mt-4 flex items-center justify-center gap-2">
        {card.onPrevious && (
          <button
            type="button"
            onClick={card.onPrevious}
            className="rounded-md border border-white/30 bg-transparent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Previous
          </button>
        )}
        <button
          type="button"
          onClick={card.onPrimary}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-white/90"
        >
          {card.primaryLabel}
        </button>
      </div>
    </div>,
    mountNode,
  );
}
