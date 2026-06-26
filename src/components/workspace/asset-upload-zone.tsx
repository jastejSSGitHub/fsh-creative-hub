"use client";

import { useRef, useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
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
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
          dragging
            ? "border-hub-final bg-hub-final/10"
            : "border-hub-espresso/15 bg-white/50",
        )}
      >
        <p className="font-display text-lg font-bold text-hub-espresso">
          Drop images or videos here
        </p>
        <p className="mt-1 text-sm text-hub-espresso/55">
          JPG, PNG, WebP, GIF, MP4, WebM
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-4 min-h-10 rounded-md border-hub-espresso/15 px-4",
          )}
        >
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
      {message && (
        <p className="text-sm text-hub-espresso/60">{message}</p>
      )}
    </div>
  );
}
