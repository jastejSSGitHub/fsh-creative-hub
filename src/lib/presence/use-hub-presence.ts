"use client";

import { useEffect, useMemo, useState } from "react";

import { readMockCollaborationData } from "@/lib/dev-tools/storage";
import { createClient } from "@/lib/supabase/client";

export type HubPresenceUser = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  taskId: string | null;
};

type PresencePayload = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  task_id: string | null;
};

const MOCK_PRESENCE: HubPresenceUser[] = [
  {
    userId: "mock-user-2",
    displayName: "Alex Rivera",
    avatarUrl: null,
    taskId: null,
  },
];

function parsePresenceState(
  state: Record<string, PresencePayload[]>,
): HubPresenceUser[] {
  const byUser = new Map<string, HubPresenceUser>();

  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      if (!entry?.user_id) continue;
      byUser.set(entry.user_id, {
        userId: entry.user_id,
        displayName: entry.display_name || "Teammate",
        avatarUrl: entry.avatar_url,
        taskId: entry.task_id,
      });
    }
  }

  return [...byUser.values()];
}

export function useProjectPresence(options: {
  projectId: string | null | undefined;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  taskId?: string | null;
  enabled?: boolean;
}): HubPresenceUser[] {
  const [others, setOthers] = useState<HubPresenceUser[]>([]);
  const mock = readMockCollaborationData();

  useEffect(() => {
    if (!options.enabled || !options.projectId) {
      setOthers([]);
      return;
    }

    if (mock) {
      setOthers(MOCK_PRESENCE.filter((u) => u.userId !== options.userId));
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel(`presence:project:${options.projectId}`, {
      config: { presence: { key: options.userId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresencePayload>();
      setOthers(
        parsePresenceState(state).filter((u) => u.userId !== options.userId),
      );
    });

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await channel.track({
        user_id: options.userId,
        display_name: options.displayName,
        avatar_url: options.avatarUrl ?? null,
        task_id: options.taskId ?? null,
      });
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    mock,
    options.avatarUrl,
    options.displayName,
    options.enabled,
    options.projectId,
    options.taskId,
    options.userId,
  ]);

  return useMemo(() => others, [others]);
}

export function useTaskViewers(
  projectId: string | null | undefined,
  taskId: string,
  allPresent: HubPresenceUser[],
): HubPresenceUser[] {
  return useMemo(
    () => allPresent.filter((u) => u.taskId === taskId),
    [allPresent, taskId],
  );
}
