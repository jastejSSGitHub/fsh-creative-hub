import { HubTooltip } from "@/components/ui/hub-tooltip";
import { roleLabel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { ProjectMemberPreview } from "@/lib/projects/queries";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type MemberAvatarStackProps = {
  members: ProjectMemberPreview[];
  max?: number;
  className?: string;
};

export function MemberAvatarStack({
  members,
  max = 4,
  className,
}: MemberAvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  if (members.length === 0) {
    return (
      <span className={cn("font-mono text-[0.65rem] text-hub-espresso/40", className)}>
        No members
      </span>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visible.map((member) => (
          <HubTooltip
            key={member.id}
            label={`${member.display_name} · ${roleLabel(member.role)}`}
            className="z-10 hover:z-20"
          >
            <span
              className="inline-flex size-8 items-center justify-center rounded-full border-2 border-white bg-hub-espresso/10 font-mono text-[0.6rem] font-semibold text-hub-espresso"
            >
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatar_url}
                  alt=""
                  className="size-full rounded-full object-cover"
                />
              ) : (
                initials(member.display_name)
              )}
            </span>
          </HubTooltip>
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-2 font-mono text-[0.65rem] text-hub-espresso/50">
          +{overflow}
        </span>
      )}
    </div>
  );
}
