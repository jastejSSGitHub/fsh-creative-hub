"use client";

import Image from "next/image";

import type { MarqueeMediaItem } from "@/components/landing/marquee-media";
import { cn } from "@/lib/utils";

type MarqueeMediaCardProps = {
  item: MarqueeMediaItem;
  className?: string;
};

export function MarqueeMediaCard({ item, className }: MarqueeMediaCardProps) {
  return (
    <div
      className={cn(
        "relative h-28 w-44 shrink-0 overflow-hidden rounded-lg bg-hub-espresso shadow-lg sm:h-36 sm:w-56",
        className,
      )}
    >
      {item.type === "video" ? (
        <video
          src={item.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          aria-label={item.label}
        />
      ) : (
        <Image
          src={item.src}
          alt={item.label}
          fill
          sizes="(max-width: 640px) 176px, 224px"
          className="object-cover"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/80">
          {item.label}
        </p>
      </div>
    </div>
  );
}
