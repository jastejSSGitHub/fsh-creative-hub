"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { readMockCollaborationData } from "@/lib/dev-tools/storage";
import { isE2ePresenceUser } from "@/lib/e2e/is-e2e-test-user";

import {
  joinProjectPresenceRoom,
  updateProjectPresenceConsumer,
} from "./project-presence-room";

export type HubPresenceUser = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  taskId: string | null;
};

const MOCK_PRESENCE: HubPresenceUser[] = [
  {
    userId: "mock-user-2",
    displayName: "Alex Rivera",
    avatarUrl: null,
    taskId: null,
  },
];

export function useProjectPresence(options: {
  projectId: string | null | undefined;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  taskId?: string | null;
  enabled?: boolean;
}): HubPresenceUser[] {
  const [others, setOthers] = useState<HubPresenceUser[]>([]);
  const consumerIdRef = useRef<symbol | null>(null);
  const projectIdRef = useRef<string | null>(null);
  const leaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    leaveRef.current?.();
    leaveRef.current = null;
    consumerIdRef.current = null;
    projectIdRef.current = null;

    if (!options.enabled || !options.projectId) {
      setOthers((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    if (readMockCollaborationData()) {
      setOthers(MOCK_PRESENCE.filter((u) => u.userId !== options.userId));
      return;
    }

    const projectId = options.projectId;
    projectIdRef.current = projectId;

    const { consumerId, leave } = joinProjectPresenceRoom(projectId, {
      userId: options.userId,
      displayName: options.displayName,
      avatarUrl: options.avatarUrl ?? null,
      taskId: options.taskId ?? null,
      onChange: setOthers,
    });
    consumerIdRef.current = consumerId;
    leaveRef.current = leave;

    return () => {
      leave();
      leaveRef.current = null;
      consumerIdRef.current = null;
      projectIdRef.current = null;
    };
  }, [options.enabled, options.projectId, options.userId]);

  useEffect(() => {
    const projectId = projectIdRef.current;
    const consumerId = consumerIdRef.current;
    if (!projectId || !consumerId || !options.enabled || !options.projectId) return;
    if (readMockCollaborationData()) return;

    updateProjectPresenceConsumer(projectId, consumerId, {
      displayName: options.displayName,
      avatarUrl: options.avatarUrl ?? null,
      taskId: options.taskId ?? null,
    });
  }, [
    options.avatarUrl,
    options.displayName,
    options.enabled,
    options.projectId,
    options.taskId,
  ]);

  return useMemo(
    () => others.filter((user) => !isE2ePresenceUser(user)),
    [others],
  );
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
