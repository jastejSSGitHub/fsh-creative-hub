"use client";

import { useEffect, useState } from "react";

import {
  readReviewBoardNavigationSnapshot,
  type ReviewBoardNavigationSnapshot,
} from "@/lib/projects/review-board-snapshot";

export function useReviewBoardNavigationSnapshot(
  projectId: string | undefined,
  boardId: string | undefined,
): ReviewBoardNavigationSnapshot | null {
  const [snapshot, setSnapshot] = useState<ReviewBoardNavigationSnapshot | null>(null);

  useEffect(() => {
    if (!projectId || !boardId) {
      setSnapshot(null);
      return;
    }
    setSnapshot(readReviewBoardNavigationSnapshot(projectId, boardId));
  }, [projectId, boardId]);

  return snapshot;
}
