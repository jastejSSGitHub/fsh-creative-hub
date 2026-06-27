"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

type RenameSuccessBadgeProps = {
  visible: boolean;
  className?: string;
};

export function RenameSuccessBadge({ visible, className }: RenameSuccessBadgeProps) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible ? (
        <motion.span
          key="rename-success"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.82 }}
          transition={{
            duration: reducedMotion ? 0.15 : 0.28,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={className}
          role="status"
          aria-live="polite"
          aria-label="Name saved"
        >
          <Check className="size-3.5 stroke-[2.75]" aria-hidden />
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
