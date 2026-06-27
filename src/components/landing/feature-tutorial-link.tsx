"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";

import { LoomTutorialModal } from "@/components/landing/loom-tutorial-modal";
import { loomEmbedUrl } from "@/lib/loom";
import { cn } from "@/lib/utils";

export type FeatureTutorialConfig = {
  loomUrl: string;
  modalTitle: string;
};

type FeatureTutorialLinkProps = {
  tutorial: FeatureTutorialConfig;
};

export function FeatureTutorialLink({ tutorial }: FeatureTutorialLinkProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const previewSrc = loomEmbedUrl(tutorial.loomUrl, {
    autoplay: true,
    muted: true,
  });

  const openModal = useCallback(() => {
    setPreviewOpen(false);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <>
      <div className="pt-3">
        <div
          className="relative inline-block"
          onMouseEnter={() => setPreviewOpen(true)}
          onMouseLeave={() => setPreviewOpen(false)}
          onFocus={() => setPreviewOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setPreviewOpen(false);
            }
          }}
        >
          <button
            type="button"
            onClick={openModal}
            className={cn(
              "group inline-flex items-center gap-1.5 text-left text-sm font-medium text-[#5B9BFF]",
              "underline decoration-[#5B9BFF]/35 underline-offset-[5px] transition-colors",
              "hover:text-[#3A86FF] hover:decoration-[#3A86FF]/55",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B9BFF]",
            )}
          >
            <span>Quick tutorial</span>
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </button>

          <AnimatePresence>
            {previewOpen && previewSrc && !prefersReducedMotion ? (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "pointer-events-none absolute bottom-[calc(100%+0.65rem)] left-0 z-20 w-[min(18rem,80vw)]",
                  "overflow-hidden rounded-xl border border-white/30",
                  "bg-white/15 shadow-[0_16px_48px_rgba(11,11,11,0.22)] backdrop-blur-xl",
                )}
              >
                <div className="relative aspect-video w-full bg-black/50">
                  <iframe
                    key={previewSrc}
                    src={previewSrc}
                    title={`${tutorial.modalTitle} preview`}
                    allow="autoplay; fullscreen; picture-in-picture"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
                <p className="bg-[#0b0b0b]/88 px-3 py-2 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-white">
                  Click to watch with sound
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <LoomTutorialModal
        open={modalOpen}
        loomUrl={tutorial.loomUrl}
        title={tutorial.modalTitle}
        onClose={closeModal}
      />
    </>
  );
}
