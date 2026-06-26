export type CoverImageOption = {
  id: string;
  label: string;
  src: string;
  /** Vertical focus when cropped into the short document banner strip (0–100). */
  bannerPosition: number;
};

export const DEFAULT_COVER_IMAGES: CoverImageOption[] = [
  {
    id: "art1",
    label: "Mist Valley",
    src: "/media/Text Document Banners/Art1.png",
    bannerPosition: 40,
  },
];

export function coverImageById(id: string): CoverImageOption | undefined {
  return DEFAULT_COVER_IMAGES.find((image) => image.id === id);
}

export function encodePublicAssetPath(path: string): string {
  if (!path.startsWith("/")) return path;

  return path
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join("/");
}

export function resolveCoverImageSrc(value: string): string {
  const preset = coverImageById(value);
  return encodePublicAssetPath(preset?.src ?? value);
}

export function defaultCoverImagePosition(value: string): number {
  return coverImageById(value)?.bannerPosition ?? 50;
}
