"use client";

import { Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import {
  assetTypeFromFile,
  fileToName,
  fileToTag,
  isFixFilename,
  sanitizeFilename,
} from "@/lib/assets/file-meta";
import { createClient } from "@/lib/supabase/client";
import { uploadNewAssetVersionAction } from "@/lib/workspace/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AssetVersionUploadProps = {
  assetId: string;
  projectId: string;
  initiativeId: string;
  boardId?: string;
  disabled?: boolean;
  onUploaded: () => void;
  onError?: (message: string) => void;
  className?: string;
};

export function AssetVersionUpload({
  assetId,
  projectId,
  initiativeId,
  boardId,
  disabled,
  onUploaded,
  onError,
  className,
}: AssetVersionUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFile(file: File) {
    const type = assetTypeFromFile(file);
    if (!type) {
      const msg = "Unsupported file type. Use JPG, PNG, WebP, GIF, MP4, or WebM.";
      setError(msg);
      onError?.(msg);
      return;
    }

    setError(null);
    const supabase = createClient();
    const safeName = sanitizeFilename(file.name);
    const storagePath = boardId
      ? `${projectId}/${boardId}/${initiativeId}/${Date.now()}-${safeName}`
      : `${projectId}/${initiativeId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("hub-media")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      onError?.(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("hub-media").getPublicUrl(storagePath);

    const result = await uploadNewAssetVersionAction({
      assetId,
      projectId,
      boardId,
      name: fileToName(file.name),
      type,
      storagePath,
      publicUrl,
      tag: fileToTag(file.name),
      isFixCandidate: isFixFilename(file.name),
    });

    if (!result.ok) {
      setError(result.error);
      onError?.(result.error);
      return;
    }

    onUploaded();
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file || disabled || isPending) return;
          startTransition(() => handleFile(file));
        }}
      />
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={() => inputRef.current?.click()}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 gap-1.5 rounded-md text-xs",
        )}
      >
        <Upload className="size-3.5" />
        {isPending ? "Uploading…" : "Upload new version"}
      </button>
      {error && <p className="mt-1.5 text-xs text-hub-rejected">{error}</p>}
      <p className="mt-1 text-[0.625rem] leading-snug text-hub-foreground/45">
        Keeps comments and tasks on this file. Previous version is saved to history.
      </p>
    </div>
  );
}
