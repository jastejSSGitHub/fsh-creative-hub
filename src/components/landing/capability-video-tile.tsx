"use client";

import { cn } from "@/lib/utils";

type CapabilityVideoTileProps = {
  src: string;
  label: string;
  aspect?: "square" | "video" | "portrait";
  className?: string;
  priority?: boolean;
};

export function CapabilityVideoTile({
  src,
  label,
  aspect = "square",
  className,
  priority = false,
}: CapabilityVideoTileProps) {
  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  }[aspect];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-hub-espresso shadow-lg",
        aspectClass,
        className,
      )}
    >
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        className="absolute inset-0 h-full w-full object-cover"
        aria-label={label}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/80">
          {label}
        </p>
      </div>
    </div>
  );
}
