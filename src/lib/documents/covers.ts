export type CoverGradient = {
  id: string;
  label: string;
  css: string;
};

export const COVER_GRADIENTS: CoverGradient[] = [
  {
    id: "sunset",
    label: "Sunset",
    css: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)",
  },
  {
    id: "ocean",
    label: "Ocean",
    css: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #312e81 100%)",
  },
  {
    id: "forest",
    label: "Forest",
    css: "linear-gradient(135deg, #22c55e 0%, #059669 50%, #14532d 100%)",
  },
  {
    id: "ember",
    label: "Ember",
    css: "linear-gradient(135deg, #ef4444 0%, #f97316 50%, #fbbf24 100%)",
  },
  {
    id: "slate",
    label: "Slate",
    css: "linear-gradient(135deg, #64748b 0%, #334155 50%, #0f172a 100%)",
  },
  {
    id: "lavender",
    label: "Lavender",
    css: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #7c3aed 100%)",
  },
  {
    id: "cream",
    label: "Cream",
    css: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
  },
  {
    id: "midnight",
    label: "Midnight",
    css: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)",
  },
];

export function gradientById(id: string): CoverGradient | undefined {
  return COVER_GRADIENTS.find((g) => g.id === id);
}
