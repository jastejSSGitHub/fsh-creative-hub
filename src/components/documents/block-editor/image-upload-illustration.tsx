"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type ImageUploadIllustrationProps = {
  active?: boolean;
  className?: string;
};

export function ImageUploadIllustration({
  active = false,
  className,
}: ImageUploadIllustrationProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      className={cn("relative mx-auto h-[7.5rem] w-[8.5rem]", className)}
      animate={
        active
          ? { scale: 1.05, y: -2 }
          : reduced
            ? { scale: 1, y: 0 }
            : { scale: 1, y: [0, -3, 0] }
      }
      transition={
        active
          ? { type: "spring", stiffness: 320, damping: 24 }
          : reduced
            ? undefined
            : { duration: 4, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <div className="absolute left-1/2 top-[62%] size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#18a0fb]/15 blur-2xl" />
      <div className="absolute left-[12%] top-[38%] size-12 rounded-full bg-hub-accent/20 blur-xl" />

      <div
        className="absolute left-[4%] top-[22%] w-[3.25rem] origin-bottom-right"
        style={{
          transform: "perspective(560px) rotateY(-16deg) rotateX(12deg) rotateZ(-10deg)",
        }}
      >
        <div className="overflow-hidden rounded-[0.65rem] border border-white/85 bg-white shadow-[0_8px_22px_rgba(11,11,11,0.14)]">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#FFD4A8] via-[#FF9F6B] to-[#FF7E5F]">
            <div className="absolute right-2 top-2 size-2 rounded-full bg-white/80 shadow-sm" />
            <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#6BBF8A]/90 to-transparent" />
            <div className="absolute bottom-0 left-[15%] h-[30%] w-[35%] rounded-t-full bg-[#4FAF78]/90" />
          </div>
        </div>
      </div>

      <div
        className="absolute left-[2.1rem] top-[6%] w-[3.75rem] origin-bottom-left"
        style={{
          transform: "perspective(560px) rotateY(12deg) rotateX(10deg) rotateZ(8deg)",
        }}
      >
        <div className="overflow-hidden rounded-[0.7rem] border border-white/90 bg-white shadow-[0_10px_26px_rgba(11,11,11,0.16)]">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#7DD3FC] via-[#38BDF8] to-[#0EA5E9]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-7 items-center justify-center rounded-full bg-white/95 shadow-md">
                <svg viewBox="0 0 24 24" className="size-3.5 text-[#18a0fb]" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 12l-3 4h12l-4-5z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute right-[2%] top-[28%] w-[3rem] origin-bottom"
        style={{
          transform: "perspective(560px) rotateY(18deg) rotateX(6deg) rotateZ(14deg)",
        }}
      >
        <div className="overflow-hidden rounded-[0.6rem] border border-white/85 bg-white shadow-[0_6px_18px_rgba(11,11,11,0.12)]">
          <div className="relative aspect-square bg-gradient-to-br from-[#C084FC] via-[#A855F7] to-[#EC4899]">
            <div className="absolute inset-2 rounded-[0.35rem] border-2 border-dashed border-white/50" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
