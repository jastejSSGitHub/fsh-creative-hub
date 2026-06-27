"use client";

import { Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { AssetDropIllustration } from "@/components/workspace/asset-drop-illustration";
import { AssetDropZoneHeroIllustration } from "@/components/workspace/asset-drop-zone-hero-illustration";
import {
  assetTypeFromFile,
  fileToName,
  fileToTag,
  isFixFilename,
  sanitizeFilename,
} from "@/lib/assets/file-meta";
import { createClient } from "@/lib/supabase/client";
import { registerAssetAction } from "@/lib/workspace/actions";
import { cn } from "@/lib/utils";

type AssetUploadZoneProps = {
  projectId: string;
  initiativeId: string;
  boardId?: string;
  onUploadStart?: () => void;
  onUploaded: (assetId: string) => void | Promise<void>;
  onUploadComplete?: (lastAssetId: string) => void;
  onUploadBatchEnd?: (lastAssetId: string | null) => void;
  onUploadError?: (message: string) => void;
};

export function AssetUploadZone({
  projectId,
  initiativeId,
  boardId,
  onUploadStart,
  onUploaded,
  onUploadComplete,
  onUploadBatchEnd,
  onUploadError,
}: AssetUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    setErrorMessage(null);
    onUploadStart?.();
    const supabase = createClient();
    let lastAssetId: string | null = null;

    for (const file of list) {
      const type = assetTypeFromFile(file);
      if (!type) {
        const msg = `${file.name}: unsupported file type.`;
        setErrorMessage(msg);
        onUploadError?.(msg);
        continue;
      }

      const safeName = sanitizeFilename(file.name);
      const storagePath = boardId
        ? `${projectId}/${boardId}/${initiativeId}/${Date.now()}-${safeName}`
        : `${projectId}/${initiativeId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("hub-media")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setErrorMessage(uploadError.message);
        onUploadError?.(uploadError.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("hub-media").getPublicUrl(storagePath);

      const result = await registerAssetAction({
        projectId,
        initiativeId,
        boardId,
        name: fileToName(file.name),
        type,
        storagePath,
        publicUrl,
        tag: fileToTag(file.name),
        isFixCandidate: isFixFilename(file.name),
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        onUploadError?.(result.error);
        continue;
      }

      if (result.id) {
        lastAssetId = result.id;
        await onUploaded(result.id);
      }
    }

    if (lastAssetId) {
      onUploadComplete?.(lastAssetId);
    }
    onUploadBatchEnd?.(lastAssetId);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (isPending) return;

    startTransition(async () => {
      await uploadFiles(event.dataTransfer.files);
    });
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "hub-upload-surface overflow-hidden",
          dragging && "hub-upload-surface--active",
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="flex min-h-[9rem] flex-col items-center justify-center px-6 py-8 text-center md:col-span-3"
          >
            <div className="mb-1">
              <AssetDropZoneHeroIllustration active={dragging} />
            </div>

            <p className="font-display text-[1.05rem] font-semibold tracking-tight text-hub-foreground">
              Drop images or videos here
            </p>
            <p className="mt-1 text-[0.8125rem] text-hub-foreground/45">
              JPG, PNG, WebP, GIF, MP4, WebM
            </p>

            <button
              type="button"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "mt-5 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-hub-foreground/8 bg-hub-surface px-4 py-2 text-[0.8125rem] font-medium text-hub-foreground transition-all duration-200",
                "hover:bg-hub-paper active:scale-[0.98]",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {!isPending && <Plus className="size-3.5" strokeWidth={2} aria-hidden />}
              {isPending ? "Uploading…" : "Choose files"}
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                if (!e.target.files?.length) return;
                startTransition(async () => {
                  await uploadFiles(e.target.files!);
                  e.target.value = "";
                });
              }}
            />
          </div>

          <div className="flex min-h-[9rem] items-center border-t border-hub-foreground/[0.06] px-2 py-3 md:col-span-1 md:border-l md:border-t-0">
            <AssetDropIllustration />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="text-sm text-hub-rejected">{errorMessage}</p>
      ) : null}
    </div>
  );
}
