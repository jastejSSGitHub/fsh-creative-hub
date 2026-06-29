import { GrainOverlay } from "@/components/landing/grain-overlay";
import { cn } from "@/lib/utils";

const THUMB_PALETTES = [
  "from-[#E85D4C] via-[#F4A261] to-[#E9C46A]",
  "from-[#2A9D8F] via-[#48CAE4] to-[#90E0EF]",
  "from-[#7B2CBF] via-[#C77DFF] to-[#E0AAFF]",
  "from-[#D62828] via-[#F77F00] to-[#FCBF49]",
  "from-[#3A86FF] via-[#8338EC] to-[#FF006E]",
  "from-[#06D6A0] via-[#118AB2] to-[#073B4C]",
  "from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4]",
  "from-[#5C4B99] via-[#A663CC] to-[#FFB3C6]",
] as const;

type AssetPlaceholderProps = {
  index?: number;
  label?: string;
  className?: string;
  aspect?: "square" | "video" | "portrait" | "wide";
};

export function AssetPlaceholder({
  index = 0,
  label,
  className,
  aspect = "square",
}: AssetPlaceholderProps) {
  const palette = THUMB_PALETTES[index % THUMB_PALETTES.length];
  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[16/10]",
  }[aspect];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-hub-espresso shadow-lg",
        aspectClass,
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90",
          palette,
        )}
      />
      <GrainOverlay variant="frame" animated={false} />
      <div className="absolute inset-0 z-[2] bg-black/10" />
      {label ? (
        <div className="absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/80">
            {label}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function getThumbPalette(index: number) {
  return THUMB_PALETTES[index % THUMB_PALETTES.length];
}
