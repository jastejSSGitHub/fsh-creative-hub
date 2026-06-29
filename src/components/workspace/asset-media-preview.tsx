"use client";

import { Film, ImageIcon, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type PlayMode = "static" | "loop";

type AssetMediaPreviewProps = {
  type: "image" | "video";
  src: string;
  alt: string;
  className?: string;
  playMode?: PlayMode;
};

const VIDEO_URL_RE = /\.(mp4|webm|mov)(\?|$)/i;

export function inferAssetMediaType(
  url: string,
  explicitType?: "image" | "video",
): "image" | "video" {
  if (explicitType) return explicitType;
  return VIDEO_URL_RE.test(url) ? "video" : "image";
}

export function AssetMediaPreview({
  type,
  src,
  alt,
  className,
  playMode = "static",
}: AssetMediaPreviewProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type !== "video" || playMode !== "loop") return;

    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [type, playMode, status]);

  return (
    <div
      ref={containerRef}
      className={cn("relative size-full overflow-hidden bg-hub-foreground/5", className)}
    >
      {status === "loading" && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
          aria-hidden
        >
          <div className="hub-shimmer absolute inset-0" />

          {type === "video" ? (
            <>
              <div className="relative flex items-end gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className="hub-film-frame w-2.5 rounded-sm bg-hub-primary/35"
                    style={{
                      height: `${18 + (index % 3) * 8}px`,
                      animationDelay: `${index * 120}ms`,
                    }}
                  />
                ))}
                <Film className="absolute -top-5 left-1/2 size-4 -translate-x-1/2 text-hub-primary/50" />
              </div>
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-hub-foreground/50">
                Buffering video
              </p>
            </>
          ) : (
            <>
              <div className="relative flex size-14 items-center justify-center rounded-lg border border-hub-foreground/10 bg-hub-surface/80 shadow-sm">
                <ImageIcon className="size-6 text-hub-foreground/20" />
                <span className="hub-scan-line absolute inset-x-2 top-2 h-0.5 rounded-full bg-hub-primary/60" />
              </div>
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-hub-foreground/50">
                Loading preview
              </p>
            </>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-hub-foreground/[0.03] px-4 text-center">
          <RefreshCw className="size-4 text-hub-foreground/35" aria-hidden />
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-hub-foreground/45">
            Preview unavailable
          </p>
        </div>
      )}

      {type === "video" ? (
        <video
          ref={videoRef}
          src={src}
          className={cn(
            "size-full object-cover transition-opacity duration-500",
            status === "loaded" ? "opacity-100" : "opacity-0",
          )}
          muted
          playsInline
          loop={playMode === "loop"}
          autoPlay={playMode === "loop"}
          preload={playMode === "loop" ? "metadata" : "metadata"}
          onLoadedData={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "size-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.02]",
            status === "loaded" ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
    </div>
  );
}
