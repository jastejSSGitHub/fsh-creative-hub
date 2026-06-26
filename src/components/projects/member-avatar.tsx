"use client";

import { HubTooltip } from "@/components/ui/hub-tooltip";
import { cn } from "@/lib/utils";

export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toLowerCase();
  return `${parts[0][0]}${parts[1][0]}`.toLowerCase();
}

type MemberAvatarProps = {
  displayName: string;
  avatarUrl?: string | null;
  variant?: "primary" | "muted" | "stack";
  size?: "xs" | "sm" | "md";
  className?: string;
};

const variantClasses = {
  primary: "bg-hub-primary font-semibold text-white",
  muted: "bg-hub-espresso/8 font-mono font-semibold text-hub-espresso",
  stack:
    "border-2 border-white bg-hub-espresso/10 font-mono font-semibold text-hub-espresso",
};

const sizeClasses = {
  xs: "size-6 text-[0.625rem]",
  sm: "size-8 text-[0.58rem]",
  md: "size-9 text-xs",
};

export function MemberAvatar({
  displayName,
  avatarUrl,
  variant = "muted",
  size = "xs",
  className,
}: MemberAvatarProps) {
  const label = displayName.trim() || "Unknown user";

  return (
    <HubTooltip label={label} side="top">
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
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
