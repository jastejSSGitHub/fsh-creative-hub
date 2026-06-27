"use client";

import { Info, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { ImageLightbox } from "@/components/documents/block-editor/image-lightbox";
import { ImageUploadZone } from "@/components/documents/block-editor/image-upload-zone";
import {
  clampImageWidth,
  IMAGE_BLOCK_DEFAULT_SIZE,
  IMAGE_BLOCK_MAX_WIDTH,
  IMAGE_BLOCK_WIDTH,
  nearestImageBlockSize,
  resolveImageBlockWidth,
  resolveImagePresetWidth,
  type ImageBlockSize,
} from "@/lib/documents/image-block-sizes";
import type { DocumentBlock } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

type ImageBlockProps = {
  block: DocumentBlock;
  canEdit: boolean;
  projectId: string;
  docId: string;
  onUpdate: (patch: Partial<DocumentBlock>) => void;
  onDelete?: () => void;
};

const SIZE_LABELS: Record<ImageBlockSize, string> = {
  sm: "S",
  md: "M",
  lg: "L",
};

export function ImageBlock({
  block,
  canEdit,
  projectId,
  docId,
  onUpdate,
  onDelete,
}: ImageBlockProps) {
  const imageUrl = block.meta?.imageUrl?.trim() ?? "";
  const aspectRatio = block.meta?.imageAspectRatio ?? 4 / 3;

  const [selected, setSelected] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentMaxWidth, setContentMaxWidth] = useState<number | null>(null);

  const maxAllowedWidth = contentMaxWidth ?? IMAGE_BLOCK_MAX_WIDTH;
  const width = resolveImageBlockWidth(block.meta, maxAllowedWidth);

  useEffect(() => {
    const container = containerRef.current;
    const parent = container?.parentElement;
    if (!parent) return;

    const updateMaxWidth = () => {
      setContentMaxWidth(parent.clientWidth);
    };

    updateMaxWidth();

    const observer = new ResizeObserver(updateMaxWidth);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [imageUrl]);

  useEffect(() => {
    if (!selected) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      setSelected(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [selected]);

  const applyWidth = useCallback(
    (nextWidth: number, size?: ImageBlockSize) => {
      onUpdate({
        meta: {
          ...block.meta,
          imageWidth: clampImageWidth(nextWidth, maxAllowedWidth),
          imageSize: size ?? nearestImageBlockSize(nextWidth),
        },
      });
    },
    [block.meta, maxAllowedWidth, onUpdate],
  );

  const handleImageLoad = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      if (naturalWidth <= 0 || naturalHeight <= 0) return;
      const ratio = naturalWidth / naturalHeight;
      if (block.meta?.imageAspectRatio !== ratio) {
        onUpdate({
          meta: { ...block.meta, imageAspectRatio: ratio },
        });
      }
    },
    [block.meta, onUpdate],
  );

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!canEdit) return;
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth = width;
      const handle = event.currentTarget;

      handle.setPointerCapture(event.pointerId);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "nwse-resize";

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        applyWidth(startWidth + delta);
      };

      const onUp = (upEvent: PointerEvent) => {
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        if (handle.hasPointerCapture(upEvent.pointerId)) {
          handle.releasePointerCapture(upEvent.pointerId);
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [applyWidth, canEdit, width],
  );

  const handleUploaded = useCallback(
    (publicUrl: string) => {
      onUpdate({
        type: "image",
        content: block.content,
        meta: {
          ...block.meta,
          imageUrl: publicUrl,
          imageWidth:
            block.meta?.imageWidth ??
            resolveImagePresetWidth(IMAGE_BLOCK_DEFAULT_SIZE, maxAllowedWidth),
          imageSize: block.meta?.imageSize ?? IMAGE_BLOCK_DEFAULT_SIZE,
        },
      });
      setSelected(true);
    },
    [block.content, block.meta, maxAllowedWidth, onUpdate],
  );

  if (!imageUrl) {
    return (
      <ImageUploadZone
        projectId={projectId}
        docId={docId}
        disabled={!canEdit}
        onUploaded={handleUploaded}
      />
    );
  }

  const activeSize =
    block.meta?.imageSize ?? nearestImageBlockSize(width);

  return (
    <>
      <div
        ref={containerRef}
        className="relative inline-block max-w-full"
        onClick={(event) => {
          event.stopPropagation();
          if (canEdit) setSelected(true);
        }}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[8px] bg-hub-foreground/[0.03]",
            selected && canEdit && "ring-2 ring-[#18a0fb]/50 ring-offset-2 ring-offset-hub-paper",
          )}
          style={{ width, maxWidth: "100%", aspectRatio }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={block.content || "Document image"}
            draggable={false}
            className="size-full object-contain"
            onLoad={(event) =>
              handleImageLoad(
                event.currentTarget.naturalWidth,
                event.currentTarget.naturalHeight,
              )
            }
          />
        </div>

        {selected && canEdit ? (
          <div className="absolute -top-10 left-0 z-20 flex items-center gap-0.5 rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-1 py-0.5 shadow-md">
            {(Object.keys(IMAGE_BLOCK_WIDTH) as ImageBlockSize[]).map((size) => (
              <button
                key={size}
                type="button"
                aria-label={`${size} size`}
                title={`${size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"} size`}
                onClick={(event) => {
                  event.stopPropagation();
                  applyWidth(resolveImagePresetWidth(size, maxAllowedWidth), size);
                }}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-[4px] text-[0.6875rem] font-semibold transition-colors",
                  activeSize === size
                    ? "bg-[#18a0fb]/12 text-[#1280c7]"
                    : "text-hub-foreground/55 hover:bg-hub-foreground/[0.06] hover:text-hub-foreground",
                )}
              >
                {SIZE_LABELS[size]}
              </button>
            ))}

            <span className="mx-0.5 h-4 w-px bg-hub-foreground/10" aria-hidden />

            <button
              type="button"
              aria-label="View image info"
              title="View full image"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxOpen(true);
              }}
              className="inline-flex size-7 items-center justify-center rounded-[4px] text-hub-foreground/55 transition-colors hover:bg-hub-foreground/[0.06] hover:text-hub-foreground"
            >
              <Info className="size-3.5" />
            </button>

            {onDelete ? (
              <button
                type="button"
                aria-label="Delete image"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                className="inline-flex size-7 items-center justify-center rounded-[4px] text-red-500/80 transition-colors hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}

        {selected && canEdit ? (
          <div
            role="separator"
            aria-label="Resize image"
            onPointerDown={startResize}
            className="absolute bottom-0 right-0 z-10 size-4 translate-x-1/3 translate-y-1/3 cursor-nwse-resize touch-none"
          >
            <div className="absolute inset-0 rounded-br-[8px] border-b-2 border-r-2 border-[#18a0fb]/70 bg-[#18a0fb]/10" />
          </div>
        ) : null}
      </div>

      {block.content ? (
        <p className="mt-1.5 max-w-full text-[0.75rem] text-hub-foreground/50">
          {block.content}
        </p>
      ) : null}

      <ImageLightbox
        open={lightboxOpen}
        src={imageUrl}
        alt={block.content || "Document image"}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
