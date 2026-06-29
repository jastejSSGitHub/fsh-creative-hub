import { createHash } from "crypto";

type HashInput = {
  projectUpdatedAt: string | null;
  files: Array<{ id: string; updated_at?: string; configLength: number }>;
  assetCount: number;
  assetMaxUpdatedAt: string | null;
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
    assetCount: input.assetCount,
    assetMaxUpdatedAt: input.assetMaxUpdatedAt,
    openTaskCount: input.openTaskCount,
    taskMaxUpdatedAt: input.taskMaxUpdatedAt,
  });

  return createHash("sha256").update(canonical).digest("hex");
}
