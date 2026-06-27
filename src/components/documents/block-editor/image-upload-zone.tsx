"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { ImageUploadIllustration } from "@/components/documents/block-editor/image-upload-illustration";
import {
  DOCUMENT_IMAGE_ACCEPT,
  isAcceptedDocumentImage,
  uploadDocumentBlockImage,
} from "@/lib/documents/document-image-upload";
import { cn } from "@/lib/utils";

type ImageUploadZoneProps = {
  projectId: string;
  docId: string;
  onUploaded: (publicUrl: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ImageUploadZone({
  projectId,
  docId,
  onUploaded,
  disabled = false,
  className,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!isAcceptedDocumentImage(file)) {
        setError("Please choose a JPG, PNG, WebP, or GIF.");
        return;
      }

      setUploading(true);
      setError(null);

      const result = await uploadDocumentBlockImage(projectId, docId, file);
      setUploading(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onUploaded(result.publicUrl);
    },
    [docId, onUploaded, projectId],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="flex justify-center pb-3 pt-1">
        <ImageUploadIllustration active={dragging && !disabled} />
      </div>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || uploading}
        onKeyDown={(event) => {
          if (disabled || uploading) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          if (disabled || uploading) return;
          event.preventDefault();
          event.stopPropagation();
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (disabled || uploading) return;
          event.preventDefault();
          event.stopPropagation();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          if (disabled || uploading) return;
          event.preventDefault();
          event.stopPropagation();
          setDragging(false);
          if (event.dataTransfer.files.length) {
            handleFiles(event.dataTransfer.files);
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-[8px] border-2 border-dashed px-4 py-6 transition-colors",
          disabled
            ? "cursor-default border-hub-foreground/10 bg-hub-foreground/[0.02] opacity-70"
            : dragging
              ? "border-[#18a0fb]/60 bg-[#18a0fb]/8"
              : "border-hub-foreground/14 bg-hub-foreground/[0.02] hover:border-hub-foreground/25 hover:bg-hub-foreground/[0.04]",
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-[#18a0fb]/10 text-[#18a0fb]">
          {uploading ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-5" aria-hidden />
          )}
        </div>
        <div className="text-center">
          <p className="text-[0.875rem] font-medium text-hub-foreground">
            {uploading ? "Uploading…" : "Drop image here"}
          </p>
          <p className="mt-0.5 text-[0.75rem] text-hub-foreground/50">
            JPG, PNG, WebP, or GIF — or click to browse
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[6px] bg-hub-primary px-4 py-2.5 text-[0.875rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Adding image…
          </>
        ) : (
          <>
            <ImagePlus className="size-4" aria-hidden />
            Add image
          </>
        )}
      </button>

      {error ? (
        <p className="mt-2 text-center text-[0.75rem] text-red-600">{error}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_IMAGE_ACCEPT}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          if (event.target.files?.length) {
            handleFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />
    </div>
  );
}
