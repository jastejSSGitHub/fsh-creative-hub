"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const prefersReducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 500, damping: 40 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 40 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const wideEnough = window.matchMedia("(min-width: 1024px)").matches;
    setEnabled(finePointer && wideEnough && !prefersReducedMotion);

    if (!finePointer || !wideEnough || prefersReducedMotion) return;

    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      setHovering(
        !!target?.closest("a, button, [data-cursor-hover]"),
      );
    };

    document.body.style.cursor = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [cursorX, cursorY, prefersReducedMotion]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] mix-blend-difference"
      style={{ x: springX, y: springY }}
    >
      <motion.div
        animate={{
          width: hovering ? 48 : 12,
          height: hovering ? 48 : 12,
          x: hovering ? -24 : -6,
          y: hovering ? -24 : -6,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="rounded-full border border-white bg-hub-surface/20"
      />
    </motion.div>
  );
}
