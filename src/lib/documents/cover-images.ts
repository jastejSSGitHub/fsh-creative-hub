export type CoverImageOption = {
  id: string;
  label: string;
  src: string;
  /** Vertical focus when cropped into the short document banner strip (0–100). */
  bannerPosition: number;
};

const BANNER_MEDIA_BASE = "/media/text-document-banners";

export const DEFAULT_COVER_IMAGES: CoverImageOption[] = [
  {
    id: "mist-valley",
    label: "Mist Valley",
    src: `${BANNER_MEDIA_BASE}/mist-valley.webp`,
    bannerPosition: 40,
  },
  {
    id: "ink-mountains",
    label: "Ink Mountains",
    src: `${BANNER_MEDIA_BASE}/ink-mountains.webp`,
    bannerPosition: 45,
  },
  {
    id: "river-mist",
    label: "River Mist",
    src: `${BANNER_MEDIA_BASE}/river-mist.webp`,
    bannerPosition: 50,
  },
  {
    id: "forest-path",
    label: "Forest Path",
    src: `${BANNER_MEDIA_BASE}/forest-path.webp`,
    bannerPosition: 42,
  },
  {
    id: "desert-dawn",
    label: "Desert Dawn",
    src: `${BANNER_MEDIA_BASE}/desert-dawn.webp`,
    bannerPosition: 48,
  },
  {
    id: "blenz-banner",
    label: "Blenz Banner",
    src: `${BANNER_MEDIA_BASE}/blenz-banner.webp`,
    bannerPosition: 50,
  },
];

/** Maps older stored cover ids to the current kebab-case ids. */
export const LEGACY_COVER_IMAGE_IDS: Record<string, string> = {
  art1: "mist-valley",
  art2: "ink-mountains",
  art3: "river-mist",
  art4: "forest-path",
  art5: "desert-dawn",
  blenz_banner: "blenz-banner",
};

export const ARTWORK_COVER_IMAGE_IDS = [
  "mist-valley",
  "ink-mountains",
  "river-mist",
  "forest-path",
  "desert-dawn",
] as const;

export const BLENZ_BANNER_COVER_IMAGE_ID = "blenz-banner";

export function normalizeCoverImageId(id: string): string {
  return LEGACY_COVER_IMAGE_IDS[id] ?? id;
}

export function coverImageById(id: string): CoverImageOption | undefined {
  const normalizedId = normalizeCoverImageId(id);
  return DEFAULT_COVER_IMAGES.find((image) => image.id === normalizedId);
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
