import { cn } from "@/lib/utils";

export type CanvasGlassVariant = "panel" | "control";

/** Frosted glass shells — backdrop blur lets canvas content tint the surface. */
export function canvasGlassClass(
  themeMode: "light" | "dark",
  variant: CanvasGlassVariant = "panel",
) {
  if (themeMode === "light") {
    return variant === "control"
      ? cn(
          "border border-white/75 bg-[rgba(255,255,255,0.58)] backdrop-blur-xl backdrop-saturate-[180%]",
          "shadow-[0_2px_16px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.92)]",
          "hover:bg-[rgba(255,255,255,0.72)]",
        )
      : cn(
          "border border-white/70 bg-[rgba(255,255,255,0.52)] backdrop-blur-xl backdrop-saturate-[180%]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.88)]",
        );
  }

  return variant === "control"
    ? cn(
        "border border-white/[0.14] bg-[rgba(38,38,38,0.62)] backdrop-blur-xl backdrop-saturate-150",
        "shadow-[0_4px_24px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]",
        "hover:bg-[rgba(48,48,48,0.72)]",
      )
    : cn(
        "border border-white/[0.12] bg-[rgba(32,32,32,0.68)] backdrop-blur-xl backdrop-saturate-150",
        "shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
      );
}

export function canvasGlassControlClass(
  themeMode: "light" | "dark",
  active = false,
) {
  return cn(
    "backdrop-blur-xl transition-colors",
    canvasGlassClass(themeMode, "control"),
    themeMode === "light"
      ? cn("text-[#1a1a1a]/90", active && "bg-[rgba(255,255,255,0.78)] text-[#1a1a1a]")
      : cn("text-white/88", active && "bg-[rgba(52,52,52,0.82)] text-white"),
  );
}

export function canvasGlassTextClass(themeMode: "light" | "dark", muted = false) {
  if (muted) {
    return themeMode === "light" ? "text-[#1a1a1a]/55" : "text-white/55";
  }
  return themeMode === "light" ? "text-[#1a1a1a]/88" : "text-white/88";
}

export function canvasGlassDividerClass(themeMode: "light" | "dark") {
  return themeMode === "light" ? "border-black/[0.06]" : "border-white/10";
}

export function canvasGlassMenuItemClass(
  themeMode: "light" | "dark",
  disabled = false,
) {
  return cn(
    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.8125rem] transition-colors",
    disabled
      ? themeMode === "light"
        ? "cursor-not-allowed text-[#1a1a1a]/30"
        : "cursor-not-allowed text-white/35"
      : themeMode === "light"
        ? "text-[#1a1a1a]/88 hover:bg-black/[0.04] hover:text-[#1a1a1a]"
        : "text-white/88 hover:bg-white/[0.08] hover:text-white",
  );
}
