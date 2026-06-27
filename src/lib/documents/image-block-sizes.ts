export type ImageBlockSize = "sm" | "md" | "lg";

export const IMAGE_BLOCK_DEFAULT_SIZE: ImageBlockSize = "sm";

export const IMAGE_BLOCK_WIDTH: Record<ImageBlockSize, number> = {
  sm: 240,
  md: 480,
  lg: 720,
};

export const IMAGE_BLOCK_MIN_WIDTH = 160;
export const IMAGE_BLOCK_MAX_WIDTH = 720;

export function clampImageWidth(
  width: number,
  maxWidth: number = IMAGE_BLOCK_MAX_WIDTH,
): number {
  return Math.min(
    maxWidth,
    Math.max(IMAGE_BLOCK_MIN_WIDTH, Math.round(width)),
  );
}

export function nearestImageBlockSize(width: number): ImageBlockSize {
  const entries = Object.entries(IMAGE_BLOCK_WIDTH) as [ImageBlockSize, number][];
  let closest: ImageBlockSize = IMAGE_BLOCK_DEFAULT_SIZE;
  let minDiff = Infinity;

  for (const [size, presetWidth] of entries) {
    const diff = Math.abs(width - presetWidth);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }

  return closest;
}

export function resolveImageBlockWidth(
  meta?: {
    imageWidth?: number;
    imageSize?: ImageBlockSize;
  },
  maxWidth?: number,
): number {
  const cap = maxWidth ?? IMAGE_BLOCK_MAX_WIDTH;
  let resolved = IMAGE_BLOCK_WIDTH[IMAGE_BLOCK_DEFAULT_SIZE];

  if (typeof meta?.imageWidth === "number" && Number.isFinite(meta.imageWidth)) {
    resolved = meta.imageWidth;
  } else if (meta?.imageSize && meta.imageSize in IMAGE_BLOCK_WIDTH) {
    resolved = IMAGE_BLOCK_WIDTH[meta.imageSize];
  }

  return clampImageWidth(resolved, cap);
}

export function resolveImagePresetWidth(
  size: ImageBlockSize,
  maxWidth?: number,
): number {
  return clampImageWidth(IMAGE_BLOCK_WIDTH[size], maxWidth ?? IMAGE_BLOCK_MAX_WIDTH);
}
