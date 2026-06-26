import { formatRelativeTime } from "@/lib/format-relative-time";
import { MemberAvatar } from "@/components/projects/member-avatar";
import type { ActivityWithActor } from "@/lib/workspace/queries";

type ActivityFeedProps = {
  activities: ActivityWithActor[];
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hub-espresso/15 px-6 py-12 text-center">
        <p className="font-display text-lg font-bold text-hub-espresso">No activity yet</p>
        <p className="mt-2 text-sm text-hub-espresso/55">
          Uploads, votes, and comments will show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((item) => (
        <li
          key={item.id}
          className="flex gap-3 rounded-xl border border-hub-espresso/10 bg-white px-4 py-3"
        >
          <MemberAvatar
            displayName={item.actor.display_name}
            avatarUrl={item.actor.avatar_url}
            variant="muted"
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-hub-espresso">
              <span className="font-medium">{item.actor.display_name}</span>{" "}
              <span className="text-hub-espresso/70">{item.summary}</span>
            </p>
            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-wider text-hub-espresso/40">
              {formatRelativeTime(item.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
