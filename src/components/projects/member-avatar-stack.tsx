import { MemberAvatar } from "@/components/projects/member-avatar";
import { cn } from "@/lib/utils";
import type { ProjectMemberPreview } from "@/lib/projects/queries";

type MemberAvatarStackProps = {
  members: ProjectMemberPreview[];
  max?: number;
  className?: string;
  /** Light avatars for dark surfaces (e.g. hub header). */
  inverse?: boolean;
};

export function MemberAvatarStack({
  members,
  max = 4,
  className,
  inverse = false,
}: MemberAvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  if (members.length === 0) {
    return (
      <span className={cn("font-mono text-[0.65rem] text-hub-foreground/40", className)}>
        No members
      </span>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visible.map((member) => (
          <span key={member.id} className="relative z-10 hover:z-20">
            <MemberAvatar
              displayName={member.display_name}
              avatarUrl={member.avatar_url}
              variant={inverse ? "stackInverse" : "stack"}
              size="sm"
            />
          </span>
        ))}
      </div>
      {overflow > 0 && (
        <span
          className={cn(
            "ml-2 font-mono text-[0.65rem]",
            inverse ? "text-white/50" : "text-hub-foreground/50",
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
