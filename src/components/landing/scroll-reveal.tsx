"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
  /** When true, content stays visible even if the observer never fires. */
  essential?: boolean;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  essential = false,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.12, margin: "0px 0px -40px 0px" });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || essential) {
      setRevealed(true);
      return;
    }

    if (isInView) {
      setRevealed(true);
      return;
    }

    const fallback = window.setTimeout(() => {
      setRevealed(true);
    }, 1200);

    return () => window.clearTimeout(fallback);
  }, [essential, isInView, prefersReducedMotion]);

  const offset = {
    up: { x: 0, y: 24 },
    left: { x: -24, y: 0 },
    right: { x: 24, y: 0 },
  }[direction];

  if (prefersReducedMotion || essential) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={
        revealed
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: offset.x, y: offset.y }
      }
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
