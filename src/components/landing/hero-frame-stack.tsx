"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { HERO_CAPABILITY_VIDEOS } from "@/components/landing/hero-videos";
import { loopTransition } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";

const FRAME_CLASS =
  "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border-2 border-white bg-hub-paper shadow-[0_4px_14px_rgba(11,11,11,0.1)] sm:size-12";

type FrameMotion = {
  id: string;
  baseRotate: number;
  delay: number;
  duration: number;
  shellClassName?: string;
  children: React.ReactNode;
};

function MiniStickyNote() {
  return (
    <div
      className="relative h-[78%] w-[72%] rounded-[3px] bg-[#fff9b1] shadow-[0_2px_6px_rgba(11,11,11,0.12)]"
      style={{ rotate: "-4deg" }}
    >
      <div className="mt-2 space-y-0.5 px-1.5">
        <div className="h-0.5 w-full rounded-full bg-black/12" />
        <div className="h-0.5 w-4/5 rounded-full bg-black/9" />
        <div className="h-0.5 w-3/5 rounded-full bg-black/7" />
      </div>
      <div
        className="absolute bottom-0 right-0 size-2 bg-black/5"
        style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
      />
    </div>
  );
}

function MiniDocument() {
  return (
    <div className="flex h-[82%] w-[72%] flex-col rounded-[3px] border border-black/8 bg-white px-1.5 py-1.5 shadow-sm">
      <div className="mb-1 h-1 w-3 rounded-full bg-black/14" />
      <div className="space-y-0.5">
        <div className="h-0.5 w-full rounded-full bg-black/10" />
        <div className="h-0.5 w-[88%] rounded-full bg-black/8" />
        <div className="h-0.5 w-[62%] rounded-full bg-black/8" />
        <div className="h-0.5 w-[74%] rounded-full bg-black/6" />
      </div>
    </div>
  );
}

function MiniVideoPlayer({ reduced }: { reduced: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = HERO_CAPABILITY_VIDEOS[0]?.src ?? "/media/capabilities/brand-system/video.mp4";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;
    void video.play().catch(() => undefined);
  }, [reduced]);

  return (
    <div className="relative h-full w-full bg-[#111]">
      <video
        ref={videoRef}
        src={src}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="absolute inset-x-0 top-0 flex items-center gap-0.5 bg-gradient-to-b from-black/55 to-transparent px-1 py-0.5">
        <span className="size-1 rounded-full bg-white/35" />
        <span className="size-1 rounded-full bg-white/25" />
        <span className="size-1 rounded-full bg-white/25" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1 pb-0.5 pt-1">
        <div className="h-0.5 overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full rounded-full bg-hub-primary"
            animate={reduced ? undefined : { width: ["18%", "72%", "38%", "88%", "18%"] }}
            transition={loopTransition({ duration: 5.5, ease: "easeInOut" })}
          />
        </div>
      </div>
      {!reduced ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex size-4 items-center justify-center rounded-full bg-black/35 backdrop-blur-[1px]">
            <svg viewBox="0 0 12 12" className="ml-0.5 size-2 text-white/90" aria-hidden>
              <path d="M3 2.5v7l6.5-3.5L3 2.5z" fill="currentColor" />
            </svg>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const FRAMES: Omit<FrameMotion, "children">[] = [
  { id: "sticky", baseRotate: -5, delay: 0, duration: 4.4, shellClassName: "bg-[#faf6ea]" },
  { id: "fire", baseRotate: 4, delay: 0.35, duration: 3.9, shellClassName: "bg-[#fff8ef]" },
  { id: "initials", baseRotate: -3, delay: 0.7, duration: 4.8 },
  { id: "document", baseRotate: 3, delay: 0.2, duration: 4.1, shellClassName: "bg-[#f7f7f5]" },
  { id: "video", baseRotate: -4, delay: 0.55, duration: 3.7 },
  { id: "heart", baseRotate: 5, delay: 0.85, duration: 4.3, shellClassName: "bg-[#fff5f7]" },
];

function FrameContent({ id, reduced }: { id: string; reduced: boolean }) {
  switch (id) {
    case "sticky":
      return <MiniStickyNote />;
    case "fire":
      return <span className="select-none text-[1.35rem] leading-none sm:text-[1.45rem]">🔥</span>;
    case "initials":
      return (
        <div className="flex size-[74%] items-center justify-center rounded-[7px] bg-gradient-to-br from-[#3A86FF] to-[#8338EC] font-display text-[0.62rem] font-bold tracking-tight text-white sm:text-[0.68rem]">
          J.S.
        </div>
      );
    case "document":
      return <MiniDocument />;
    case "video":
      return <MiniVideoPlayer reduced={reduced} />;
    case "heart":
      return <span className="select-none text-[1.35rem] leading-none sm:text-[1.45rem]">❤️</span>;
    default:
      return null;
  }
}

type HeroFrameStackProps = {
  className?: string;
};

export function HeroFrameStack({ className }: HeroFrameStackProps) {
  const reduced = !!useReducedMotion();

  return (
    <div className={cn("flex items-center justify-center", className)} aria-hidden>
      {FRAMES.map((frame, index) => (
        <motion.div
          key={frame.id}
          className={cn(FRAME_CLASS, "-ml-2.5 first:ml-0 sm:-ml-3", frame.shellClassName)}
          style={{ zIndex: FRAMES.length - index }}
          initial={reduced ? false : { opacity: 0, y: 10, scale: 0.92 }}
          animate={
            reduced
              ? { opacity: 1, y: 0, scale: 1, rotate: frame.baseRotate }
              : {
                  opacity: 1,
                  y: [0, -3.5, 1.5, -2, 0],
                  rotate: [
                    frame.baseRotate,
                    frame.baseRotate + 2.5,
                    frame.baseRotate - 1.5,
                    frame.baseRotate + 1,
                    frame.baseRotate,
                  ],
                  scale: [1, 1.03, 0.99, 1.02, 1],
                }
          }
          transition={
            reduced
              ? { duration: 0.4, delay: index * 0.05 }
              : {
                  opacity: { duration: 0.45, delay: index * 0.06 },
                  y: {
                    ...loopTransition({
                      duration: frame.duration,
                      ease: [0.45, 0.05, 0.55, 0.95],
                    }),
                    delay: frame.delay,
                  },
                  rotate: {
                    ...loopTransition({
                      duration: frame.duration,
                      ease: [0.45, 0.05, 0.55, 0.95],
                    }),
                    delay: frame.delay,
                  },
                  scale: {
                    ...loopTransition({
                      duration: frame.duration * 1.1,
                      ease: [0.45, 0.05, 0.55, 0.95],
                    }),
                    delay: frame.delay + 0.15,
                  },
                }
          }
        >
          <FrameContent id={frame.id} reduced={reduced} />
        </motion.div>
      ))}
    </div>
  );
}
