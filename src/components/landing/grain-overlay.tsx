import { cn } from "@/lib/utils";

type GrainOverlayProps = {
  animated?: boolean;
  variant?: "subtle" | "frame";
  className?: string;
};

export function GrainOverlay({
  animated = true,
  variant = "subtle",
  className,
}: GrainOverlayProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "grain-overlay pointer-events-none absolute inset-0",
        variant === "frame" ? "z-[1] grain-overlay-frame" : "z-10",
        animated && "grain-overlay-animated",
        className,
      )}
    />
  );
}
