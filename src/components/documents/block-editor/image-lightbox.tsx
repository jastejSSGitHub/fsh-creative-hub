"use client";

import { Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type ImageLightboxProps = {
  open: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export function ImageLightbox({ open, src, alt = "Image preview", onClose }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setZoom(1);
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const zoomIn = useCallback(() => {
    setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP));
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-[#0b1220]/55 backdrop-blur-xl"
        onClick={onClose}
      />

      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full",
          "border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md",
          "transition-colors hover:bg-white/25",
        )}
      >
        <X className="size-4" strokeWidth={2} />
      </button>

      <div className="relative z-[1] flex max-h-[calc(100dvh-6rem)] max-w-[min(96vw,72rem)] flex-col items-center gap-4">
        <div
          className={cn(
            "overflow-auto rounded-[12px] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md",
            "max-h-[calc(100dvh-10rem)] max-w-full",
          )}
          onWheel={(event) => {
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              setZoom((value) =>
                clampZoom(value + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)),
              );
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="max-h-[calc(100dvh-12rem)] max-w-full rounded-[8px] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          />
        </div>

        <div
          className={cn(
            "flex items-center gap-1 rounded-full border border-white/20 bg-white/12 px-1.5 py-1",
            "shadow-lg backdrop-blur-md",
          )}
        >
          <button
            type="button"
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="flex size-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-[3rem] text-center text-[0.75rem] font-medium text-white/90">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="flex size-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}
