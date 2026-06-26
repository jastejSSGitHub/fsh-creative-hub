"use client";

import { Film, ImageIcon, RefreshCw } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type AssetMediaPreviewProps = {
  type: "image" | "video";
  src: string;
  alt: string;
  className?: string;
};

export function AssetMediaPreview({
  type,
  src,
  alt,
  className,
}: AssetMediaPreviewProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className={cn("relative size-full overflow-hidden bg-hub-espresso/5", className)}>
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
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-hub-espresso/50">
                Buffering video
              </p>
            </>
          ) : (
            <>
              <div className="relative flex size-14 items-center justify-center rounded-lg border border-hub-espresso/10 bg-white/80 shadow-sm">
                <ImageIcon className="size-6 text-hub-espresso/20" />
                <span className="hub-scan-line absolute inset-x-2 top-2 h-0.5 rounded-full bg-hub-primary/60" />
              </div>
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-hub-espresso/50">
                Loading preview
              </p>
            </>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-hub-espresso/[0.03] px-4 text-center">
          <RefreshCw className="size-4 text-hub-espresso/35" aria-hidden />
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-hub-espresso/45">
            Preview unavailable
          </p>
        </div>
      )}

      {type === "video" ? (
        <video
          src={src}
          className={cn(
            "size-full object-cover transition-opacity duration-500",
            status === "loaded" ? "opacity-100" : "opacity-0",
          )}
          muted
          playsInline
          preload="metadata"
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
