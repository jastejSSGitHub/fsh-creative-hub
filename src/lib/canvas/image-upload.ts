import { sanitizeFilename } from "@/lib/assets/file-meta";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isAcceptedCanvasImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.has(file.type);
}

export function getImageFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  return Array.from(dataTransfer.files).filter((file) =>
    isAcceptedCanvasImage(file),
  );
}

export function dataTransferHasCanvasImages(dataTransfer: DataTransfer): boolean {
  if (!dataTransfer.types.includes("Files")) return false;
  if (dataTransfer.items.length > 0) {
    return Array.from(dataTransfer.items).some(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );
  }
  return getImageFilesFromDataTransfer(dataTransfer).length > 0;
}

export function loadImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image dimensions."));
    img.src = src;
  });
}

export async function loadImageDimensionsFromFile(
  file: File,
): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await loadImageDimensions(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function fitImageDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(
    1,
    maxWidth / naturalWidth,
    maxHeight / naturalHeight,
  );

  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

export async function uploadCanvasImage(
  projectId: string,
  canvasId: string,
  file: File,
): Promise<
  | { ok: true; publicUrl: string; storagePath: string }
  | { ok: false; error: string }
> {
  if (!isAcceptedCanvasImage(file)) {
    return {
      ok: false,
      error: "Please drop a JPG, PNG, WebP, or GIF image.",
    };
  }

  const supabase = createClient();
  const safeName = sanitizeFilename(file.name);
  const storagePath = `${projectId}/canvas/${canvasId}/images/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("hub-media")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("hub-media").getPublicUrl(storagePath);

  return { ok: true, publicUrl, storagePath };
}
