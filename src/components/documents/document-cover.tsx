"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { COVER_GRADIENTS } from "@/lib/documents/covers";
import { DEFAULT_COVER_IMAGES, resolveCoverImageSrc } from "@/lib/documents/cover-images";
import {
  coverBackgroundStyle,
  defaultDocumentCover,
} from "@/lib/documents/defaults";
import type { DocumentCover } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

type DocumentCoverBannerProps = {
  cover: DocumentCover | null;
  canEdit: boolean;
  onChange: (cover: DocumentCover | null) => void;
};

const coverBannerClassName =
  "relative -mx-[calc((100vw-100%)/2)] mb-2 h-[12rem] w-screen max-w-none overflow-hidden sm:h-[14rem]";

function CoverImagePicker({
  open,
  onClose,
  cover,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  cover: DocumentCover;
  onChange: (cover: DocumentCover) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close cover picker"
        className="fixed inset-0 z-[130] bg-hub-foreground/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Choose banner cover"
        className="fixed left-1/2 top-1/2 z-[131] max-h-[calc(100dvh-2rem)] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[8px] border border-hub-foreground/12 bg-hub-surface p-3 shadow-2xl"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-hub-foreground/45">
            Banner images
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-[4px] text-hub-foreground/45 transition-colors hover:bg-hub-foreground/[0.06] hover:text-hub-foreground"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_COVER_IMAGES.map((image) => (
            <button
              key={image.id}
              type="button"
              title={image.label}
              onClick={() => {
                onChange({
                  kind: "image",
                  value: image.id,
                  position: image.bannerPosition,
                });
                onClose();
              }}
              className={cn(
                "relative aspect-[16/10] overflow-hidden rounded-[4px] ring-offset-2 transition-transform hover:scale-[1.02]",
                cover.kind === "image" &&
                  cover.value === image.id &&
                  "ring-2 ring-hub-primary",
              )}
            >
              <img
                src={resolveCoverImageSrc(image.id)}
                alt={image.label}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>

        <p className="mb-2 mt-4 text-[0.6875rem] font-medium uppercase tracking-wider text-hub-foreground/45">
          Gradient covers
        </p>
        <div className="grid grid-cols-4 gap-2">
          {COVER_GRADIENTS.map((g) => (
            <button
              key={g.id}
              type="button"
              title={g.label}
              onClick={() => {
                onChange({ kind: "gradient", value: g.id, position: 50 });
                onClose();
              }}
              className={cn(
                "h-10 rounded-[4px] ring-offset-2 transition-transform hover:scale-105",
                cover.kind === "gradient" &&
                  cover.value === g.id &&
                  "ring-2 ring-hub-primary",
              )}
              style={{ background: g.css }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Image URL for cover");
            if (url) onChange({ kind: "image", value: url, position: 50 });
            onClose();
          }}
          className="mt-3 w-full rounded-[6px] border border-hub-foreground/12 px-3 py-2 text-[0.8125rem] text-hub-foreground hover:bg-hub-foreground/[0.03]"
        >
          Upload image URL…
        </button>
      </div>
    </>,
    document.body,
  );
}

function CoverImageLayer({
  cover,
  position,
}: {
  cover: Extract<DocumentCover, { kind: "image" }>;
  position: number;
}) {
  const backgroundStyle = coverBackgroundStyle(cover);

  return (
    <>
      <div
        className="absolute inset-0 transition-[background-position] duration-150"
        style={{
          ...backgroundStyle,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: `center ${position}%`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-hub-paper/85 via-hub-paper/15 to-transparent"
      />
    </>
  );
}

export function DocumentCoverBannerStatic({ cover }: { cover: DocumentCover }) {
  if (cover.kind === "image") {
    return (
      <div className={coverBannerClassName} aria-hidden>
        <CoverImageLayer cover={cover} position={cover.position ?? 50} />
      </div>
    );
  }

  const backgroundStyle = coverBackgroundStyle(cover);

  return (
    <div className={coverBannerClassName} aria-hidden>
      <div
        className="absolute inset-0"
        style={backgroundStyle}
      />
    </div>
  );
}

export function DocumentCoverBanner({
  cover,
  canEdit,
  onChange,
}: DocumentCoverBannerProps) {
  const [repositioning, setRepositioning] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragY, setDragY] = useState(cover?.position ?? 50);
  const dragRef = useRef<{ startY: number; startPos: number } | null>(null);

  if (!cover) return null;

  const backgroundStyle = coverBackgroundStyle(cover);
  const position = repositioning ? dragY : (cover.position ?? 50);

  function savePosition() {
    if (!cover) return;
    onChange({ ...cover, position: dragY });
    setRepositioning(false);
  }

  return (
    <div className={cn("group", coverBannerClassName)}>
      {cover.kind === "image" ? (
        <CoverImageLayer cover={cover} position={position} />
      ) : (
        <div
          className="absolute inset-0 transition-[background-position] duration-150"
          style={{
            ...backgroundStyle,
          }}
        />
      )}

      {canEdit ? (
        <>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            {!repositioning ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                  className="rounded-[6px] bg-black/50 px-3 py-1.5 text-[0.75rem] font-medium text-white backdrop-blur-sm hover:bg-black/65"
                >
                  Change cover
                </button>
                {cover.kind === "image" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDragY(cover.position ?? 50);
                      setRepositioning(true);
                    }}
                    className="rounded-[6px] bg-black/50 px-3 py-1.5 text-[0.75rem] font-medium text-white backdrop-blur-sm hover:bg-black/65"
                  >
                    Reposition
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="rounded-[6px] bg-black/50 px-3 py-1.5 text-[0.75rem] font-medium text-white backdrop-blur-sm hover:bg-black/65"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="rounded-full bg-black/55 px-3 py-1 text-[0.75rem] text-white backdrop-blur-sm">
                  Drag image to reposition
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={savePosition}
                    className="rounded-[6px] bg-hub-primary px-3 py-1.5 text-[0.75rem] font-medium text-white"
                  >
                    Save position
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepositioning(false)}
                    className="rounded-[6px] bg-black/50 px-3 py-1.5 text-[0.75rem] font-medium text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {repositioning ? (
            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                dragRef.current = { startY: e.clientY, startPos: dragY };
              }}
              onPointerMove={(e) => {
                if (!dragRef.current) return;
                const delta = (e.clientY - dragRef.current.startY) * 0.15;
                setDragY(Math.max(0, Math.min(100, dragRef.current.startPos + delta)));
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
            />
          ) : null}

          {pickerOpen ? (
            <CoverImagePicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              cover={cover}
              onChange={onChange}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function DocumentCoverActions({
  visible,
  onAddCover,
}: {
  visible: boolean;
  onAddCover: () => void;
}) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onAddCover}
      className="rounded-[6px] px-2 py-1 text-[0.75rem] text-hub-foreground/45 transition-colors hover:bg-hub-foreground/[0.05] hover:text-hub-foreground"
    >
      Add cover
    </button>
  );
}

export function defaultCover(): DocumentCover {
  return defaultDocumentCover();
}
