"use client";

import { useCallback, useRef, useState } from "react";

import {
  CANVAS_MAX_UNDO_STEPS,
  cloneCanvasHistorySnapshot,
  canvasSnapshotsEqual,
  type CanvasHistorySnapshot,
} from "@/lib/canvas/history";

type UseCanvasHistoryOptions = {
  getSnapshot: () => CanvasHistorySnapshot;
  applySnapshot: (snapshot: CanvasHistorySnapshot) => void;
};

export function useCanvasHistory({
  getSnapshot,
  applySnapshot,
}: UseCanvasHistoryOptions) {
  const [past, setPast] = useState<CanvasHistorySnapshot[]>([]);
  const [future, setFuture] = useState<CanvasHistorySnapshot[]>([]);
  const pastRef = useRef(past);
  const futureRef = useRef(future);
  pastRef.current = past;
  futureRef.current = future;

  const applyingRef = useRef(false);
  const gestureSnapshotRef = useRef<CanvasHistorySnapshot | null>(null);
  const textBurstRecordedRef = useRef(false);
  const textBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const pushPast = useCallback((snapshot: CanvasHistorySnapshot) => {
    setPast((current) => {
      const next = [...current, snapshot];
      if (next.length > CANVAS_MAX_UNDO_STEPS) {
        return next.slice(next.length - CANVAS_MAX_UNDO_STEPS);
      }
      return next;
    });
    setFuture([]);
  }, []);

  const recordHistory = useCallback(() => {
    if (applyingRef.current) return;
    const snapshot = getSnapshot();
    pushPast(cloneCanvasHistorySnapshot(snapshot.nodes, snapshot.backgroundColor));
  }, [getSnapshot, pushPast]);

  const recordTextHistoryBurst = useCallback(() => {
    if (applyingRef.current) return;
    if (!textBurstRecordedRef.current) {
      textBurstRecordedRef.current = true;
      const snapshot = getSnapshot();
      pushPast(cloneCanvasHistorySnapshot(snapshot.nodes, snapshot.backgroundColor));
    }
    if (textBurstTimerRef.current) clearTimeout(textBurstTimerRef.current);
    textBurstTimerRef.current = setTimeout(() => {
      textBurstRecordedRef.current = false;
      textBurstTimerRef.current = null;
    }, 900);
  }, [getSnapshot, pushPast]);

  const beginHistoryGesture = useCallback(() => {
    if (applyingRef.current || gestureSnapshotRef.current) return;
    const snapshot = getSnapshot();
    gestureSnapshotRef.current = cloneCanvasHistorySnapshot(
      snapshot.nodes,
      snapshot.backgroundColor,
    );
  }, [getSnapshot]);

  const endHistoryGesture = useCallback(() => {
    const before = gestureSnapshotRef.current;
    gestureSnapshotRef.current = null;
    if (!before || applyingRef.current) return;

    const after = getSnapshot();
    if (!canvasSnapshotsEqual(before, after)) {
      pushPast(before);
    }
  }, [getSnapshot, pushPast]);

  const undo = useCallback(() => {
    if (applyingRef.current || pastRef.current.length === 0) return false;

    const previous = pastRef.current[pastRef.current.length - 1]!;
    const current = getSnapshot();

    applyingRef.current = true;
    applySnapshot(previous);
    applyingRef.current = false;

    setPast((currentPast) => currentPast.slice(0, -1));
    setFuture((currentFuture) =>
      [
        cloneCanvasHistorySnapshot(current.nodes, current.backgroundColor),
        ...currentFuture,
      ].slice(0, CANVAS_MAX_UNDO_STEPS),
    );

    return true;
  }, [applySnapshot, getSnapshot]);

  const redo = useCallback(() => {
    if (applyingRef.current || futureRef.current.length === 0) return false;

    const next = futureRef.current[0]!;
    const current = getSnapshot();

    applyingRef.current = true;
    applySnapshot(next);
    applyingRef.current = false;

    setPast((currentPast) =>
      [
        ...currentPast,
        cloneCanvasHistorySnapshot(current.nodes, current.backgroundColor),
      ].slice(-CANVAS_MAX_UNDO_STEPS),
    );
    setFuture((currentFuture) => currentFuture.slice(1));

    return true;
  }, [applySnapshot, getSnapshot]);

  return {
    canUndo,
    canRedo,
    recordHistory,
    recordTextHistoryBurst,
    beginHistoryGesture,
    endHistoryGesture,
    undo,
    redo,
  };
}
