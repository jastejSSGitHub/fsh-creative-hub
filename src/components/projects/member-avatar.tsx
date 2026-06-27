"use client";

import { HubTooltip } from "@/components/ui/hub-tooltip";
import { memberAvatarColor } from "@/lib/hub/member-avatar-color";
import { cn } from "@/lib/utils";

export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type MemberAvatarProps = {
  displayName: string;
  avatarUrl?: string | null;
  colorSeed?: string;
  variant?: "primary" | "muted" | "stack" | "stackInverse";
  size?: "xs" | "sm" | "md";
  className?: string;
};

const variantClasses = {
  primary: "font-semibold text-white",
  muted: "font-mono font-semibold text-white",
  stack: "border-2 border-white font-mono font-semibold text-white",
  stackInverse: "border-2 border-white/25 font-mono font-semibold text-white",
};

const sizeClasses = {
  xs: "size-6 text-[0.625rem]",
  sm: "size-8 text-[0.58rem]",
  md: "size-9 text-xs",
};

export function MemberAvatar({
  displayName,
  avatarUrl,
  colorSeed,
  variant = "muted",
  size = "xs",
  className,
}: MemberAvatarProps) {
  const label = displayName.trim() || "Unknown user";
  const seed = colorSeed ?? label;
  const initialsBackground = !avatarUrl ? memberAvatarColor(seed) : undefined;

  return (
    <HubTooltip label={label} side="bottom">
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          sizeClasses[size],
          !avatarUrl && variantClasses[variant],
          className,
        )}
        style={initialsBackground ? { backgroundColor: initialsBackground } : undefined}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          memberInitials(label)
        )}
      </span>
    </HubTooltip>
  );
}
