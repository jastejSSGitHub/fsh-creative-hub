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
  {
    id: "art2",
    label: "Ink Mountains",
    src: "/media/Text Document Banners/Art2.png",
    bannerPosition: 45,
  },
  {
    id: "art3",
    label: "River Mist",
    src: "/media/Text Document Banners/Art3.png",
    bannerPosition: 50,
  },
  {
    id: "art4",
    label: "Forest Path",
    src: "/media/Text Document Banners/Art4.png",
    bannerPosition: 42,
  },
  {
    id: "blenz_banner",
    label: "Blenz Banner",
    src: "/media/Text Document Banners/blenz_banner.png",
    bannerPosition: 50,
  },
];

export const ARTWORK_COVER_IMAGE_IDS = ["art1", "art2", "art3", "art4"] as const;

export const BLENZ_BANNER_COVER_IMAGE_ID = "blenz_banner";

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
