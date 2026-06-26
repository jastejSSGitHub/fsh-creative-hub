"use client";

import { useLayoutEffect, useState } from "react";

type Point = { x: number; y: number };

type CanvasOnboardingConnectorProps = {
  cardRef: React.RefObject<HTMLElement | null>;
  targetRef: React.RefObject<HTMLElement | null>;
  active: boolean;
};

function anchorOnCard(card: DOMRect, target: DOMRect): Point {
  const cardCx = card.left + card.width / 2;
  const cardCy = card.top + card.height / 2;
  const targetCx = target.left + target.width / 2;
  const targetCy = target.top + target.height / 2;
  const dx = targetCx - cardCx;
  const dy = targetCy - cardCy;

  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: dx > 0 ? card.right : card.left,
      y: cardCy,
    };
  }

  return {
    x: cardCx,
    y: dy > 0 ? card.bottom : card.top,
  };
}

function anchorOnTarget(card: DOMRect, target: DOMRect): Point {
  const cardCx = card.left + card.width / 2;
  const cardCy = card.top + card.height / 2;
  const targetCx = target.left + target.width / 2;
  const targetCy = target.top + target.height / 2;
  const dx = targetCx - cardCx;
  const dy = targetCy - cardCy;

  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: dx > 0 ? target.left : target.right,
      y: targetCy,
    };
  }

  return {
    x: targetCx,
    y: dy > 0 ? target.top : target.bottom,
  };
}

function elbowPath(start: Point, end: Point): string {
  const midX = (start.x + end.x) / 2;
  return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
}

export function CanvasOnboardingConnector({
  cardRef,
  targetRef,
  active,
}: CanvasOnboardingConnectorProps) {
  const [geometry, setGeometry] = useState<{
    path: string;
    spotlight: DOMRect;
    end: Point;
  } | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      setGeometry(null);
      return;
    }

    function measure() {
      const card = cardRef.current?.getBoundingClientRect();
      const target = targetRef.current?.getBoundingClientRect();
      if (!card || !target) {
        setGeometry(null);
        return;
      }

      const start = anchorOnCard(card, target);
      const end = anchorOnTarget(card, target);

      setGeometry({
        path: elbowPath(start, end),
        spotlight: target,
        end,
      });
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (cardRef.current) observer.observe(cardRef.current);
    if (targetRef.current) observer.observe(targetRef.current);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, cardRef, targetRef]);

  if (!active || !geometry) return null;

  const pad = 6;

  return (
    <>
      <div
        className="pointer-events-none fixed z-[48] rounded-xl border-2 border-[#7c3aed] shadow-[0_0_0_4px_rgba(124,58,237,0.25)] transition-all duration-300"
        style={{
          top: geometry.spotlight.top - pad,
          left: geometry.spotlight.left - pad,
          width: geometry.spotlight.width + pad * 2,
          height: geometry.spotlight.height + pad * 2,
        }}
        aria-hidden
      />

      <svg
        className="pointer-events-none fixed inset-0 z-[48] h-full w-full"
        aria-hidden
      >
        <path
          d={geometry.path}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={geometry.end.x} cy={geometry.end.y} r={4} fill="#7c3aed" />
      </svg>
    </>
  );
}
