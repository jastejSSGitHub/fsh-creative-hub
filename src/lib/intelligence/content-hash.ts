import { createHash } from "crypto";

type HashInput = {
  projectUpdatedAt: string | null;
  files: Array<{ id: string; updated_at?: string; configLength: number }>;
  assets: Array<{ id: string; public_url?: string | null; created_at?: string | null }>;
  openTaskCount: number;
  taskMaxUpdatedAt: string | null;
};

export function computeContentHash(input: HashInput): string {
  const canonical = JSON.stringify({
    projectUpdatedAt: input.projectUpdatedAt,
    files: input.files
      .map((file) => ({
        id: file.id,
        updated_at: file.updated_at ?? null,
        configLength: file.configLength,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    assets: input.assets
      .map((asset) => ({
        id: asset.id,
        public_url: asset.public_url ?? null,
        created_at: asset.created_at ?? null,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    openTaskCount: input.openTaskCount,
    taskMaxUpdatedAt: input.taskMaxUpdatedAt,
  });

  return createHash("sha256").update(canonical).digest("hex");
}
