import {
  ARTWORK_COVER_IMAGE_IDS,
  BLENZ_BANNER_COVER_IMAGE_ID,
  defaultCoverImagePosition,
  resolveCoverImageSrc,
} from "@/lib/documents/cover-images";
import { COVER_GRADIENTS } from "@/lib/documents/covers";
import type { DocumentCover, TextDocumentConfig } from "@/lib/documents/types";

export const DEFAULT_DOCUMENT_COVER_GRADIENT_ID = "ocean";
export const DEFAULT_DOCUMENT_ICON = "📄";
export const BLENZ_BRANDING_GUIDELINES_TITLE = "Blenz Branding Guidelines";

export function isBlenzBrandingGuidelinesDocument(documentName?: string | null): boolean {
  if (!documentName?.trim()) return false;

  const normalized = documentName.trim().toLowerCase();
  const target = BLENZ_BRANDING_GUIDELINES_TITLE.toLowerCase();

  return normalized === target || normalized.startsWith(`${target} `);
}

export function pickRandomArtworkCoverId(seed?: string): (typeof ARTWORK_COVER_IMAGE_IDS)[number] {
  if (!seed?.trim()) {
    const index = Math.floor(Math.random() * ARTWORK_COVER_IMAGE_IDS.length);
    return ARTWORK_COVER_IMAGE_IDS[index] ?? ARTWORK_COVER_IMAGE_IDS[0];
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 1)) % ARTWORK_COVER_IMAGE_IDS.length;
  }

  return ARTWORK_COVER_IMAGE_IDS[hash] ?? ARTWORK_COVER_IMAGE_IDS[0];
}

export function defaultDocumentCover(documentName?: string | null): DocumentCover {
  const imageId = isBlenzBrandingGuidelinesDocument(documentName)
    ? BLENZ_BANNER_COVER_IMAGE_ID
    : pickRandomArtworkCoverId(documentName ?? undefined);

  return {
    kind: "image",
    value: imageId,
    position: defaultCoverImagePosition(imageId),
  };
}

export function defaultDocumentIcon(): string {
  return DEFAULT_DOCUMENT_ICON;
}

export function resolveDocumentCover(
  cover: DocumentCover | null,
  documentName?: string | null,
): DocumentCover {
  return cover ?? defaultDocumentCover(documentName);
}

export function resolveDocumentIcon(icon: string | null): string {
  return icon ?? defaultDocumentIcon();
}

export function shouldApplyLegacyDocumentDefaults(
  config: Pick<TextDocumentConfig, "cover" | "icon" | "blocks">,
): boolean {
  return (
    config.cover === null &&
    config.icon === null &&
    config.blocks.length === 1 &&
    config.blocks[0]?.type === "paragraph" &&
    !config.blocks[0]?.content.trim()
  );
}

export function coverBackgroundStyle(cover: DocumentCover): {
  background?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
} {
  if (cover.kind === "gradient") {
    const css =
      COVER_GRADIENTS.find((gradient) => gradient.id === cover.value)?.css ??
      COVER_GRADIENTS[0]!.css;
    return { background: css };
  }

  const position = cover.position ?? defaultCoverImagePosition(cover.value);

  return {
    backgroundImage: `url("${resolveCoverImageSrc(cover.value)}")`,
    backgroundPosition: `center ${position}%`,
  };
}
