import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { isE2ePresenceUser } from "@/lib/e2e/is-e2e-test-user";

import type { HubPresenceUser } from "./use-hub-presence";

type PresencePayload = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  task_id: string | null;
};

export type PresenceConsumer = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  taskId: string | null;
  onChange: (others: HubPresenceUser[]) => void;
};

type ProjectPresenceRoom = {
  channel: RealtimeChannel;
  consumers: Map<symbol, PresenceConsumer>;
  subscribed: boolean;
};

const rooms = new Map<string, ProjectPresenceRoom>();

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

function othersForConsumer(
  room: ProjectPresenceRoom,
  consumer: PresenceConsumer,
): HubPresenceUser[] {
  const state = room.channel.presenceState<PresencePayload>();
  return parsePresenceState(state).filter(
    (user) => user.userId !== consumer.userId && !isE2ePresenceUser(user),
  );
}

function notifyRoom(room: ProjectPresenceRoom) {
  for (const consumer of room.consumers.values()) {
    consumer.onChange(othersForConsumer(room, consumer));
  }
}

function mergedTrackPayload(room: ProjectPresenceRoom, userId: string) {
  let displayName = "Teammate";
  let avatarUrl: string | null = null;
  let taskId: string | null = null;

  for (const consumer of room.consumers.values()) {
    if (consumer.userId !== userId) continue;
    displayName = consumer.displayName;
    avatarUrl = consumer.avatarUrl;
    if (consumer.taskId) taskId = consumer.taskId;
  }

  return {
    user_id: userId,
    display_name: displayName,
    avatar_url: avatarUrl,
    task_id: taskId,
  };
}

async function syncTrack(room: ProjectPresenceRoom) {
  if (!room.subscribed) return;

  const trackedUserIds = new Set<string>();
  for (const consumer of room.consumers.values()) {
    trackedUserIds.add(consumer.userId);
  }

  for (const userId of trackedUserIds) {
    await room.channel.track(mergedTrackPayload(room, userId));
  }
}

function ensureRoom(projectId: string, userId: string): ProjectPresenceRoom {
  const existing = rooms.get(projectId);
  if (existing) return existing;

  const supabase = createClient();
  const channel = supabase.channel(`presence:project:${projectId}`, {
    config: { presence: { key: userId } },
  });

  const room: ProjectPresenceRoom = {
    channel,
    consumers: new Map(),
    subscribed: false,
  };
  rooms.set(projectId, room);

  channel.on("presence", { event: "sync" }, () => {
    notifyRoom(room);
  });

  void channel.subscribe(async (status) => {
    if (status !== "SUBSCRIBED") return;
    room.subscribed = true;
    await syncTrack(room);
    notifyRoom(room);
  });

  return room;
}

function destroyRoomIfEmpty(projectId: string) {
  const room = rooms.get(projectId);
  if (!room || room.consumers.size > 0) return;

  const supabase = createClient();
  void supabase.removeChannel(room.channel);
  rooms.delete(projectId);
}

export function joinProjectPresenceRoom(
  projectId: string,
  consumer: PresenceConsumer,
): { consumerId: symbol; leave: () => void } {
  const room = ensureRoom(projectId, consumer.userId);
  const consumerId = Symbol(`presence:${projectId}`);
  room.consumers.set(consumerId, consumer);

  if (room.subscribed) {
    void syncTrack(room).then(() => {
      consumer.onChange(othersForConsumer(room, consumer));
    });
  }

  return {
    consumerId,
    leave: () => {
      room.consumers.delete(consumerId);
      void syncTrack(room);
      destroyRoomIfEmpty(projectId);
    },
  };
}

export function updateProjectPresenceConsumer(
  projectId: string,
  consumerId: symbol,
  patch: Partial<PresenceConsumer>,
) {
  const room = rooms.get(projectId);
  if (!room) return;

  const consumer = room.consumers.get(consumerId);
  if (!consumer) return;

  Object.assign(consumer, patch);
  void syncTrack(room);
  consumer.onChange(othersForConsumer(room, consumer));
}
