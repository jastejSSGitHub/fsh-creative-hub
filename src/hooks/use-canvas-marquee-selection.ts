"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  findNodesInMarquee,
  normalizeWorldRect,
  type WorldRect,
} from "@/lib/canvas/marquee-selection";
import type { CanvasNode } from "@/lib/canvas/types";

const MARQUEE_DRAG_THRESHOLD_PX = 4;

function isMarqueeBlockedTarget(target: HTMLElement, surface: HTMLElement) {
  if (target === surface) return false;

  if (target.closest("[data-canvas-node]")) return true;

  return Boolean(
    target.closest(
      "[data-sticky-toolbar], [data-sticky-toolbar-popover], [data-text-toolbar], [data-text-toolbar-popover], [data-stamp-toolbar], [data-embed-toolbar], [data-embed-interactive], [data-canvas-marquee]",
    ),
  );
}

type UseCanvasMarqueeSelectionOptions = {
  enabled: boolean;
  nodes: CanvasNode[];
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  onSelectNodes: (ids: string[], options?: { additive?: boolean }) => void;
  onClearSelection: () => void;
};

export function useCanvasMarqueeSelection({
  enabled,
  nodes,
  clientToWorld,
  onSelectNodes,
  onClearSelection,
}: UseCanvasMarqueeSelectionOptions) {
  const [marqueeRect, setMarqueeRect] = useState<WorldRect | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const sessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startWorldX: number;
    startWorldY: number;
    additive: boolean;
    active: boolean;
  } | null>(null);

  const cancelMarquee = useCallback(() => {
    sessionRef.current = null;
    setMarqueeRect(null);
  }, []);

  useEffect(() => {
    if (enabled) return;
    cancelMarquee();
  }, [cancelMarquee, enabled]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || event.button !== 0) return;

      const surface = surfaceRef.current ?? event.currentTarget;
      const target = event.target as HTMLElement;
      if (isMarqueeBlockedTarget(target, surface)) return;

      const startWorld = clientToWorld(event.clientX, event.clientY);
      const session = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startWorldX: startWorld.x,
        startWorldY: startWorld.y,
        additive: event.shiftKey,
        active: false,
      };
      sessionRef.current = session;

      event.stopPropagation();
      event.preventDefault();

      function handleWindowPointerMove(moveEvent: PointerEvent) {
        const activeSession = sessionRef.current;
        if (!activeSession || activeSession.pointerId !== moveEvent.pointerId) return;

        const dx = moveEvent.clientX - activeSession.startClientX;
        const dy = moveEvent.clientY - activeSession.startClientY;

        if (
          !activeSession.active &&
          Math.hypot(dx, dy) < MARQUEE_DRAG_THRESHOLD_PX
        ) {
          return;
        }

        activeSession.active = true;
        const currentWorld = clientToWorld(moveEvent.clientX, moveEvent.clientY);
        setMarqueeRect(
          normalizeWorldRect(
            activeSession.startWorldX,
            activeSession.startWorldY,
            currentWorld.x,
            currentWorld.y,
          ),
        );
      }

      function finishSession(upEvent: PointerEvent) {
        const activeSession = sessionRef.current;
        if (!activeSession || activeSession.pointerId !== upEvent.pointerId) return;

        window.removeEventListener("pointermove", handleWindowPointerMove);
        window.removeEventListener("pointerup", finishSession);
        window.removeEventListener("pointercancel", finishSession);

        if (activeSession.active) {
          const endWorld = clientToWorld(upEvent.clientX, upEvent.clientY);
          const rect = normalizeWorldRect(
            activeSession.startWorldX,
            activeSession.startWorldY,
            endWorld.x,
            endWorld.y,
          );
          const ids = findNodesInMarquee(nodesRef.current, rect);
          if (ids.length > 0) {
            onSelectNodes(ids, { additive: activeSession.additive });
          } else if (!activeSession.additive) {
            onClearSelection();
          }
        } else if (!activeSession.additive) {
          onClearSelection();
        }

        cancelMarquee();
      }

      window.addEventListener("pointermove", handleWindowPointerMove);
      window.addEventListener("pointerup", finishSession);
      window.addEventListener("pointercancel", finishSession);
    },
    [cancelMarquee, clientToWorld, enabled, onClearSelection, onSelectNodes],
  );

  return {
    surfaceRef,
    marqueeRect,
    marqueeHandlers: {
      onPointerDown: handlePointerDown,
    },
  };
}
