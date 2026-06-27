"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Moon } from "lucide-react";

export type AssetUploadIndicatorPhase = "idle" | "uploading" | "success" | "error";

type AssetUploadIndicatorProps = {
  phase: AssetUploadIndicatorPhase;
  message?: string;
};

export function AssetUploadIndicator({ phase, message }: AssetUploadIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const visible = phase !== "idle";

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="asset-upload-indicator"
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="pointer-events-none fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[70] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-hub-espresso/90 px-4 py-2 text-[0.8125rem] font-medium text-white shadow-[0_8px_32px_rgba(11,11,11,0.22)] backdrop-blur-md">
            <span className="relative flex size-5 items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {phase === "uploading" ? (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.span
                      animate={
                        reduceMotion
                          ? undefined
                          : { rotate: [-6, 6, -6], opacity: [0.75, 1, 0.75] }
                      }
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Moon className="size-4 fill-white/15 text-white/90" strokeWidth={1.75} />
                    </motion.span>
                  </motion.span>
                ) : phase === "success" ? (
                  <motion.span
                    key="check"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.5, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 520, damping: 26 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-hub-approved/20">
                      <Check className="size-3.5 text-hub-approved" strokeWidth={2.5} aria-hidden />
                    </span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center text-hub-rejected"
                  >
                    !
                  </motion.span>
                )}
              </AnimatePresence>
            </span>

            <motion.span
              key={phase + (message ?? "")}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {phase === "uploading"
                ? "Uploading…"
                : phase === "success"
                  ? "Uploaded"
                  : message ?? "Upload failed"}
            </motion.span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
