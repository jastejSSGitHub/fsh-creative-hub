import { sanitizeFilename } from "@/lib/assets/file-meta";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isAcceptedCoverImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.has(file.type);
}

export function normalizeCoverImageUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function uploadDocumentCoverImage(
  projectId: string,
  docId: string,
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  if (!isAcceptedCoverImage(file)) {
    return {
      ok: false,
      error: "Please choose a JPG, PNG, WebP, or GIF image.",
    };
  }

  const supabase = createClient();
  const safeName = sanitizeFilename(file.name);
  const storagePath = `${projectId}/docs/${docId}/covers/${Date.now()}-${safeName}`;

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

  return { ok: true, publicUrl };
}
