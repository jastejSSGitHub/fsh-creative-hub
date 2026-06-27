"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { loomEmbedUrl } from "@/lib/loom";
import { cn } from "@/lib/utils";

type LoomTutorialModalProps = {
  open: boolean;
  loomUrl: string;
  title: string;
  onClose: () => void;
};

export function LoomTutorialModal({
  open,
  loomUrl,
  title,
  onClose,
}: LoomTutorialModalProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const embedSrc = loomEmbedUrl(loomUrl, { autoplay: true, muted: false });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleClose]);

  if (!mounted || !embedSrc) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="loom-tutorial-modal"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          <button
            type="button"
            aria-label="Close tutorial"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleClose}
          />

          <motion.div
            className={cn(
              "relative z-[1] flex h-[min(92dvh,54rem)] w-[min(96vw,72rem)] flex-col overflow-hidden rounded-2xl",
              "border border-white/20 bg-white/10 shadow-[0_32px_96px_rgba(0,0,0,0.45)] backdrop-blur-2xl",
            )}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, scale: 0.96, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.98, y: 8 }
            }
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0b0b0b]/88 px-4 py-3 sm:px-5">
              <p className="font-display text-sm font-semibold tracking-tight text-white sm:text-base">
                {title}
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  "border border-white/20 bg-white/10 text-white backdrop-blur-md",
                  "transition-colors hover:bg-white/20",
                )}
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 bg-black/50">
              <iframe
                key={embedSrc}
                src={embedSrc}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
