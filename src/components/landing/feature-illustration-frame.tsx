"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FeatureIllustrationFrameProps = {
  gradientClassName: string;
  children: ReactNode;
  className?: string;
};

export function FeatureIllustrationFrame({
  gradientClassName,
  children,
  className,
}: FeatureIllustrationFrameProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      data-cursor-hover
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }
      }
      className={cn("w-full", className)}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-md p-5 shadow-[0_24px_64px_rgba(11,11,11,0.12)] sm:p-6 md:p-8",
          gradientClassName,
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
