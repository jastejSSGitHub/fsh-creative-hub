import type { CSSProperties } from "react";

import { ARTWORK_COVER_IMAGE_IDS, coverImageById } from "@/lib/documents/cover-images";

export type LandingArtKey = "art1" | "art2" | "art3" | "art4" | "art5";

export const LANDING_ART_BACKGROUNDS = Object.fromEntries(
  ARTWORK_COVER_IMAGE_IDS.map((id, index) => [
    `art${index + 1}`,
    coverImageById(id)!.src,
  ]),
) as Record<LandingArtKey, string>;

/** Cover artwork mapped to the five core hub feature visuals. */
export const FEATURE_VISUAL_ART_BACKGROUNDS = {
  projects: LANDING_ART_BACKGROUNDS.art1,
  review: LANDING_ART_BACKGROUNDS.art2,
  comments: LANDING_ART_BACKGROUNDS.art3,
  ideas: LANDING_ART_BACKGROUNDS.art4,
  present: LANDING_ART_BACKGROUNDS.art5,
} as const;

export type FeatureVisualKey = keyof typeof FEATURE_VISUAL_ART_BACKGROUNDS;

export function landingArtBackgroundStyle(src: string): CSSProperties {
  return {
    backgroundImage: `url(${src})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
