"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type TrimmedLoopVideoProps = {
  src: string;
  startAt?: number;
  label: string;
  className?: string;
};

export function TrimmedLoopVideo({
  src,
  startAt = 2,
  label,
  className,
}: TrimmedLoopVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(containerRef, { margin: "80px" });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const seekToStart = () => {
      if (video.duration && video.duration > startAt) {
        video.currentTime = startAt;
      }
    };

    const handleEnded = () => {
      video.currentTime = startAt;
      void video.play().catch(() => undefined);
    };

    video.addEventListener("loadedmetadata", seekToStart);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", seekToStart);
      video.removeEventListener("ended", handleEnded);
    };
  }, [startAt, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [inView]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        preload="metadata"
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        aria-label={label}
      />
    </div>
  );
}
