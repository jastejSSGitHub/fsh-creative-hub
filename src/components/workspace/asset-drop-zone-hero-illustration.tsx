"use client";

import { motion, useReducedMotion } from "framer-motion";

import { loopTransition } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";

type AssetDropZoneHeroIllustrationProps = {
  active?: boolean;
  className?: string;
};

export function AssetDropZoneHeroIllustration({
  active = false,
  className,
}: AssetDropZoneHeroIllustrationProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      className={cn("relative mx-auto h-16 w-[5.75rem]", className)}
      animate={
        active
          ? { scale: 1.06, y: -1 }
          : reduced
            ? { scale: 1, y: 0 }
            : { scale: 1, y: [0, -2.5, 0] }
      }
      transition={
        active
          ? { type: "spring", stiffness: 320, damping: 24 }
          : reduced
            ? undefined
            : loopTransition({ duration: 4.2 })
      }
    >
      <div className="absolute left-1/2 top-[58%] size-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hub-accent/20 blur-2xl" />
      <div className="absolute left-[18%] top-[42%] size-10 -translate-y-1/2 rounded-full bg-hub-primary/10 blur-xl" />

      <div
        className="absolute left-0 top-[18%] w-[2.65rem] origin-bottom-right"
        style={{
          transform: "perspective(520px) rotateY(-18deg) rotateX(10deg) rotateZ(-11deg)",
        }}
      >
        <div className="overflow-hidden rounded-[0.55rem] border border-white/80 bg-hub-surface shadow-[0_6px_16px_rgba(11,11,11,0.12),0_1px_0_rgba(255,255,255,0.8)_inset]">
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#FFD4A8] via-[#FF9F6B] to-[#FF7E5F]">
            <div className="absolute right-2 top-2 size-2 rounded-full bg-white/75 shadow-sm" />
            <div className="absolute bottom-0 left-0 right-0 h-[42%] bg-gradient-to-t from-[#6BBF8A]/85 to-[#6BBF8A]/35" />
            <div className="absolute bottom-0 left-[18%] h-[28%] w-[38%] rounded-t-full bg-[#4FAF78]/90" />
            <div className="absolute bottom-0 right-[10%] h-[34%] w-[46%] rounded-t-full bg-[#3D9464]/85" />
          </div>
        </div>
      </div>

      <div
        className="absolute left-[1.55rem] top-[4%] w-[3rem] origin-bottom-left"
        style={{
          transform: "perspective(520px) rotateY(14deg) rotateX(8deg) rotateZ(9deg)",
        }}
      >
        <div className="overflow-hidden rounded-[0.6rem] border border-white/80 bg-hub-surface shadow-[0_8px_20px_rgba(11,11,11,0.14),0_1px_0_rgba(255,255,255,0.85)_inset]">
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#8B5CF6] via-[#A855F7] to-[#EC4899]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-5 items-center justify-center rounded-full bg-hub-surface/95 shadow-[0_2px_8px_rgba(11,11,11,0.16)]">
                <svg viewBox="0 0 10 12" className="ml-0.5 size-2 fill-hub-espresso/78" aria-hidden>
                  <path d="M0 0v12l10-6L0 0z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-end gap-0.5">
              {[0.35, 0.7, 0.5, 0.85, 0.55].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-full bg-hub-surface/40"
                  style={{ height: `${height * 8}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute -right-0.5 top-0 z-10"
        style={{
          transform: "perspective(520px) rotateY(-8deg) rotateX(12deg) rotateZ(6deg)",
        }}
      >
        <div className="relative flex size-7 items-center justify-center rounded-full border border-white/70 bg-gradient-to-b from-[#FFE082] via-[#FFC94B] to-[#E6A800] shadow-[0_5px_0_0_rgba(166,124,0,0.18),0_10px_18px_rgba(11,11,11,0.14)]">
          <span className="text-[1.05rem] font-bold leading-none text-hub-espresso/88">+</span>
          <div className="pointer-events-none absolute inset-x-1.5 top-1 h-2 rounded-full bg-white/35" />
        </div>
      </div>
    </motion.div>
  );
}
