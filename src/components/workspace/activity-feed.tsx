"use client";

import { useCallback, useEffect, useState } from "react";

import { MemberAvatar } from "@/components/projects/member-avatar";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_VERB_META } from "@/lib/workspace/activity-meta";
import { getActivityForProject, type ActivityWithActor } from "@/lib/workspace/queries";
import { cn } from "@/lib/utils";

type ActivityFeedProps = {
  activities: ActivityWithActor[];
  projectId: string;
};

export function ActivityFeed({ activities: initialActivities, projectId }: ActivityFeedProps) {
  const [activities, setActivities] = useState(initialActivities);

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const data = await getActivityForProject(supabase, projectId);
    setActivities(data);
  }, [projectId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`activity-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hub_activity",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId, refresh]);

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hub-foreground/15 bg-hub-surface/70 px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-hub-foreground">No activity yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-hub-foreground/55">
          Uploads, votes, comments, and approvals will stream here in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface shadow-sm">
      <div className="border-b border-hub-foreground/8 px-4 py-3.5 sm:px-5">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-hub-foreground/45">
          Project activity
        </p>
        <p className="mt-0.5 text-xs text-hub-foreground/55">
          Live feed across every board and section in this project.
        </p>
      </div>

      <ul className="divide-y divide-hub-espresso/6">
        {activities.map((item, index) => {
          const meta = ACTIVITY_VERB_META[item.verb];

          return (
            <li
              key={item.id}
              className={cn(
                "flex gap-3 px-4 py-4 sm:gap-4 sm:px-5",
                index === 0 && "bg-hub-foreground/[0.015]",
              )}
            >
              <div className="relative flex flex-col items-center">
                <MemberAvatar
                  displayName={item.actor.display_name}
                  avatarUrl={item.actor.avatar_url}
                  colorSeed={item.actor.id}
                  variant="muted"
                  size="md"
                />
                {index < activities.length - 1 && (
                  <span
                    className="mt-2 hidden h-full w-px flex-1 bg-hub-foreground/10 sm:block"
                    aria-hidden
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-hub-foreground">
                    {item.actor.display_name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.08em]",
                      meta.accent,
                    )}
                  >
                    <span aria-hidden>{meta.icon}</span>
                    {meta.label}
                  </span>
                  <span className="font-mono text-[0.58rem] text-hub-foreground/35">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-hub-foreground/75">
                  {item.summary}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
