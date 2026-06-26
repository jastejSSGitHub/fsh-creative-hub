"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(containerRef, { margin: "120px" });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [inView]);

  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  }[aspect];

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-hub-espresso shadow-lg",
        aspectClass,
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload={priority ? "metadata" : "none"}
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
