"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { AuthTransitionIllustration } from "@/components/auth/auth-transition-illustration";

type AuthTransitionOverlayProps = {
  visible: boolean;
  label: string;
};

function ProgressShimmer({ reduced }: { reduced: boolean }) {
  if (reduced) {
    return (
      <div className="h-full w-2/5 rounded-full bg-hub-final/80" aria-hidden />
    );
  }

  return (
    <motion.div
      className="h-full w-2/5 rounded-full bg-gradient-to-r from-hub-final/40 via-hub-final to-hub-final/40"
      aria-hidden
      initial={{ x: "-120%" }}
      animate={{ x: "320%" }}
      transition={{
        duration: 1.35,
        repeat: Infinity,
        ease: [0.45, 0, 0.55, 1],
      }}
    />
  );
}

export function AuthTransitionOverlay({
  visible,
  label,
}: AuthTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-hub-espresso/45 px-6 backdrop-blur-[6px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.22, ease: "easeOut" }}
        >
          <motion.div
            className="w-full max-w-xs overflow-hidden rounded-2xl border border-hub-espresso/10 bg-hub-paper shadow-[0_24px_64px_rgba(26,15,8,0.22)]"
            initial={reduced ? false : { opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
              mass: 0.85,
            }}
          >
            <div className="px-8 pb-9 pt-8 text-center">
              <motion.div
                initial={reduced ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reduced ? 0 : 0.05, duration: 0.32 }}
              >
                <AuthTransitionIllustration reduced={reduced} />
              </motion.div>

              <motion.p
                key={label}
                className="mt-6 font-display text-lg font-semibold tracking-tight text-hub-espresso"
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0 : 0.1, duration: 0.28 }}
              >
                {label}
              </motion.p>

              <div className="mx-auto mt-5 h-1 w-24 overflow-hidden rounded-full bg-hub-espresso/10">
                <ProgressShimmer reduced={reduced} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
