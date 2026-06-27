import { Play } from "lucide-react";

import { MemberAvatarStack } from "@/components/projects/member-avatar-stack";
import type { ProjectMemberPreview } from "@/lib/projects/queries";

type BoardStats = {
  approved: number;
  rejected: number;
  total: number;
};

type WorkspaceDetailToolbarProps = {
  members: ProjectMemberPreview[];
  stats?: BoardStats | null;
  showStats?: boolean;
  showInvite?: boolean;
  showPresent?: boolean;
  onInvite?: () => void;
  onPresent?: () => void;
};

export function WorkspaceDetailToolbar({
  members,
  stats,
  showStats = false,
  showInvite = false,
  showPresent = false,
  onInvite,
  onPresent,
}: WorkspaceDetailToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
      {showStats && stats && (
        <div className="flex items-center gap-1.5 rounded-full border border-hub-foreground/12 bg-hub-surface px-2.5 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider shadow-sm sm:gap-2 sm:px-3 sm:text-[0.625rem]">
          <span className="font-semibold text-green-800">{stats.approved} approved</span>
          <span className="text-hub-foreground/30" aria-hidden>
            ·
          </span>
          <span className="font-medium text-red-700">{stats.rejected} rejected</span>
          <span className="text-hub-foreground/30" aria-hidden>
            ·
          </span>
          <span className="font-semibold text-hub-foreground">{stats.total} total</span>
        </div>
      )}

      <MemberAvatarStack members={members} max={6} />

      {showInvite && onInvite && (
        <button
          type="button"
          onClick={onInvite}
          className="inline-flex h-8 items-center justify-center rounded-[6px] bg-hub-primary px-3 text-[0.8125rem] font-medium text-white shadow-sm transition-colors hover:bg-[#1590e8]"
        >
          Invite
        </button>
      )}

      {showPresent && onPresent && (
        <button
          type="button"
          onClick={onPresent}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-3 text-[0.8125rem] font-medium text-hub-foreground transition-colors hover:bg-hub-foreground/[0.03]"
        >
          <Play className="size-3 fill-current" aria-hidden />
          Present
        </button>
      )}
    </div>
  );
}
