import { cn } from "@/lib/utils";

type GrainOverlayProps = {
  animated?: boolean;
  className?: string;
};

export function GrainOverlay({ animated = true, className }: GrainOverlayProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "grain-overlay pointer-events-none absolute inset-0 z-10",
        animated && "grain-overlay-animated",
        className,
      )}
    />
  );
}
