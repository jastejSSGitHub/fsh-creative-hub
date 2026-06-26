"use client";

import { ImagePlus, Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { AssetDropIllustration } from "@/components/workspace/asset-drop-illustration";
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
  onUploaded: () => void;
};

export function AssetUploadZone({
  projectId,
  initiativeId,
  boardId,
  onUploaded,
}: AssetUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    setMessage(null);
    const supabase = createClient();

    for (const file of list) {
      const type = assetTypeFromFile(file);
      if (!type) {
        setMessage(`${file.name}: unsupported file type.`);
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
        setMessage(uploadError.message);
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
        setMessage(result.error);
        return;
      }
    }

    onUploaded();
    setMessage(`${list.length} file${list.length === 1 ? "" : "s"} uploaded.`);
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
            <div
              className={cn(
                "mb-3 flex size-11 items-center justify-center rounded-2xl bg-hub-espresso/[0.04] transition-all duration-300",
                dragging && "scale-105 bg-hub-final/15",
              )}
            >
              <ImagePlus
                className={cn(
                  "size-5 text-hub-espresso/40 transition-colors duration-300",
                  dragging && "text-hub-espresso/70",
                )}
                strokeWidth={1.5}
                aria-hidden
              />
            </div>

            <p className="font-display text-[1.05rem] font-semibold tracking-tight text-hub-espresso">
              Drop images or videos here
            </p>
            <p className="mt-1 text-[0.8125rem] text-hub-espresso/45">
              JPG, PNG, WebP, GIF, MP4, WebM
            </p>

            <button
              type="button"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "mt-5 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-hub-espresso/8 bg-white px-4 py-2 text-[0.8125rem] font-medium text-hub-espresso transition-all duration-200",
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

          <div className="flex min-h-[9rem] items-center border-t border-hub-espresso/[0.06] px-2 py-3 md:col-span-1 md:border-l md:border-t-0">
            <AssetDropIllustration />
          </div>
        </div>
      </div>

      {message && (
        <p className="text-sm text-hub-espresso/60">{message}</p>
      )}
    </div>
  );
}
