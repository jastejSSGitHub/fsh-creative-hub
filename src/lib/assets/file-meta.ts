export function fileToName(filename: string): string {
  return filename
    .replace(/^\d+[-_]/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fileToTag(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("collage")) return "Collage";
  if (lower.includes("menu")) return "Menu Board";
  if (lower.includes("grid") || lower.includes("lineup")) return "Group Lineup";
  return "Marketing Poster";
}

export function assetTypeFromFile(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function isFixFilename(filename: string): boolean {
  return filename.toLowerCase().startsWith("fix-");
}
