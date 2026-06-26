export type SectionPresetId = "graphics" | "menus" | "videos" | "custom";

export const SECTION_PRESETS: {
  id: SectionPresetId;
  label: string;
  initiativeName: string;
}[] = [
  { id: "graphics", label: "Graphics", initiativeName: "Marketing Visuals" },
  { id: "menus", label: "Menus", initiativeName: "Menus" },
  { id: "videos", label: "Videos", initiativeName: "Video Assets" },
];

export function initiativeNameForSection(
  preset: SectionPresetId,
  customName?: string,
): string {
  if (preset === "custom") {
    return customName?.trim() || "Custom Section";
  }
  return SECTION_PRESETS.find((s) => s.id === preset)?.initiativeName ?? "Section";
}
