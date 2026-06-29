import { MemberAvatar } from "@/components/projects/member-avatar";
import { filterE2eTestUsers } from "@/lib/e2e/is-e2e-test-user";
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
  const visibleMembers = filterE2eTestUsers(members);
  const visible = visibleMembers.slice(0, max);
  const overflow = visibleMembers.length - visible.length;

  if (visibleMembers.length === 0) {
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
              colorSeed={member.id}
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
