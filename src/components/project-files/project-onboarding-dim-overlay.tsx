"use client";

type ProjectOnboardingDimOverlayProps = {
  onBackdropClick?: () => void;
};

export function ProjectOnboardingDimOverlay({
  onBackdropClick,
}: ProjectOnboardingDimOverlayProps) {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[44] bg-[rgba(15,15,15,0.52)]"
      aria-hidden
      onClick={onBackdropClick}
      onKeyDown={undefined}
    />
  );
}
