"use client";

import { MemberAvatar } from "@/components/projects/member-avatar";
import { useProjectPresence } from "@/lib/presence/use-hub-presence";
import { cn } from "@/lib/utils";

type ProjectPresenceStackProps = {
  projectId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  className?: string;
  size?: "sm" | "md";
};

export function ProjectPresenceStack({
  projectId,
  userId,
  displayName,
  avatarUrl,
  className,
  size = "sm",
}: ProjectPresenceStackProps) {
  const others = useProjectPresence({
    projectId,
    userId,
    displayName,
    avatarUrl,
    enabled: true,
  });

  if (others.length === 0) return null;

  const visible = others.slice(0, 3);
  const overflow = others.length - visible.length;
  const avatarSize = size === "sm" ? "xs" : "sm";

  return (
    <div
      className={cn("flex items-center", className)}
      title={others.map((u) => u.displayName).join(", ")}
    >
      <div className="flex -space-x-1.5">
        {visible.map((user) => (
          <MemberAvatar
            key={user.userId}
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
            size={avatarSize}
            className="ring-2 ring-hub-surface-muted"
          />
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-1 text-[0.625rem] tabular-nums text-hub-foreground/45">
          +{overflow}
        </span>
      )}
    </div>
  );
}
