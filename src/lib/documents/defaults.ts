import {
  defaultCoverImagePosition,
  resolveCoverImageSrc,
} from "@/lib/documents/cover-images";
import { COVER_GRADIENTS } from "@/lib/documents/covers";
import type { DocumentCover, TextDocumentConfig } from "@/lib/documents/types";

export const DEFAULT_DOCUMENT_COVER_GRADIENT_ID = "ocean";
export const DEFAULT_DOCUMENT_COVER_IMAGE_ID = "art1";
export const DEFAULT_DOCUMENT_ICON = "📄";

export function defaultDocumentCover(): DocumentCover {
  return {
    kind: "image",
    value: DEFAULT_DOCUMENT_COVER_IMAGE_ID,
    position: defaultCoverImagePosition(DEFAULT_DOCUMENT_COVER_IMAGE_ID),
  };
}

export function defaultDocumentIcon(): string {
  return DEFAULT_DOCUMENT_ICON;
}

export function resolveDocumentCover(cover: DocumentCover | null): DocumentCover {
  return cover ?? defaultDocumentCover();
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
