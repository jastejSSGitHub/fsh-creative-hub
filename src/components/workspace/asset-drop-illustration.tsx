"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const FILE_TYPES = [
  {
    id: "jpeg",
    label: "JPEG",
    ext: ".jpg",
    gradient: "from-[#FF8A5B] to-[#FFC371]",
    accent: "#FF8A5B",
    preview: "sunset",
  },
  {
    id: "png",
    label: "PNG",
    ext: ".png",
    gradient: "from-[#2EC4B6] to-[#6EE7F9]",
    accent: "#2EC4B6",
    preview: "transparent",
  },
  {
    id: "video",
    label: "MP4",
    ext: ".mp4",
    gradient: "from-[#9B5DE5] to-[#F15BB5]",
    accent: "#9B5DE5",
    preview: "video",
  },
] as const;

const PHASE_DURATION_MS = 2600;

function FilePreview({
  preview,
  gradient,
}: {
  preview: (typeof FILE_TYPES)[number]["preview"];
  gradient: string;
}) {
  if (preview === "transparent") {
    return (
      <div
        className="absolute inset-0 rounded-[0.65rem]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #ececec 25%, transparent 25%), linear-gradient(-45deg, #ececec 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ececec 75%), linear-gradient(-45deg, transparent 75%, #ececec 75%)",
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
        }}
      >
        <div
          className={cn(
            "absolute inset-2 rounded-md bg-gradient-to-br opacity-95",
            gradient,
          )}
        />
      </div>
    );
  }

  if (preview === "video") {
    return (
      <>
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-6 items-center justify-center rounded-full bg-hub-surface/95 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <svg viewBox="0 0 10 12" className="ml-0.5 size-2.5 fill-hub-espresso/80">
              <path d="M0 0v12l10-6L0 0z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-end gap-0.5">
          {[0.35, 0.65, 0.45, 0.85, 0.55].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-hub-surface/45"
              style={{ height: `${h * 10}px` }}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      <div className="absolute bottom-3 left-3 right-3 h-2 rounded-full bg-hub-surface/35" />
      <div className="absolute bottom-6 left-3 h-1.5 w-7 rounded-full bg-hub-surface/45" />
      <div className="absolute right-3 top-3 size-2.5 rounded-full bg-hub-surface/55" />
    </>
  );
}

export function AssetDropIllustration() {
  const prefersReducedMotion = useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const activeFile = FILE_TYPES[phaseIndex];

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setPhaseIndex((current) => (current + 1) % FILE_TYPES.length);
    }, PHASE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden
      className="relative mx-auto flex w-full max-w-[9rem] flex-col items-center justify-center gap-2.5 py-0.5"
    >
      <div className="relative flex h-[6.25rem] w-full items-end justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFile.id}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: -36, scale: 0.88 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? undefined
                : { opacity: 0, y: 6, scale: 0.94, transition: { duration: 0.25 } }
            }
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 26,
            }}
            className="relative w-[5.75rem]"
          >
            <div className="relative overflow-hidden rounded-[0.9rem] bg-hub-surface">
              <div className="relative aspect-[4/3] overflow-hidden">
                <FilePreview
                  preview={activeFile.preview}
                  gradient={activeFile.gradient}
                />
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-[0.55rem] font-semibold tracking-wide text-hub-foreground/75">
                  {activeFile.label}
                </span>
                <span className="text-[0.5rem] text-hub-foreground/35">
                  {activeFile.ext}
                </span>
              </div>
            </div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 420, damping: 20 }}
              className="absolute -bottom-1.5 -right-1.5 flex size-[1.35rem] items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
              style={{ backgroundColor: activeFile.accent }}
            >
              ✓
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-3 bottom-0 h-8 rounded-full bg-gradient-to-t from-hub-espresso/[0.04] to-transparent" />
      </div>

      <div className="flex items-center gap-1">
        {FILE_TYPES.map((file, index) => (
          <motion.div
            key={file.id}
            animate={{
              width: phaseIndex === index ? "0.875rem" : "0.3rem",
              opacity: phaseIndex === index ? 1 : 0.35,
              backgroundColor:
                phaseIndex === index ? file.accent : "rgba(11,11,11,0.15)",
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="h-[0.3rem] rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
