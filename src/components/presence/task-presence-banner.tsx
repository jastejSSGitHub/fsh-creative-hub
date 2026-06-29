"use client";

import { MemberAvatar } from "@/components/projects/member-avatar";
import type { HubPresenceUser } from "@/lib/presence/use-hub-presence";

type TaskPresenceBannerProps = {
  viewers: HubPresenceUser[];
};

export function TaskPresenceBanner({ viewers }: TaskPresenceBannerProps) {
  if (viewers.length === 0) return null;

  const names = viewers.map((v) => v.displayName);
  const label =
    names.length === 1
      ? `${names[0]} is viewing this task`
      : `${names.slice(0, 2).join(", ")}${names.length > 2 ? ` +${names.length - 2}` : ""} are viewing this task`;

  return (
    <div className="flex items-center gap-2 rounded-[6px] border border-hub-foreground/10 bg-hub-foreground/[0.03] px-3 py-2">
      <div className="flex -space-x-1">
        {viewers.slice(0, 3).map((viewer) => (
          <MemberAvatar
            key={viewer.userId}
            displayName={viewer.displayName}
            avatarUrl={viewer.avatarUrl}
            size="xs"
            className="ring-2 ring-hub-paper"
          />
        ))}
      </div>
      <p className="text-xs text-hub-foreground/65">{label}</p>
    </div>
  );
}
