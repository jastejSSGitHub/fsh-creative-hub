"use client";

import { useEffect, useRef, type RefObject } from "react";

const IDLE_BEFORE_FADE_MS = 3_500;
const FADE_OUT_MS = 450;
const POSITION_LERP = 0.14;
const OPACITY_LERP = 0.18;

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export type CanvasCursorGlowState = {
  x: number;
  y: number;
  opacity: number;
};

export function useCanvasCursorGlow(
  containerRef: RefObject<HTMLDivElement | null>,
): RefObject<CanvasCursorGlowState> {
  const glowRef = useRef<CanvasCursorGlowState>({
    x: -9999,
    y: -9999,
    opacity: 0,
  });

  const targetRef = useRef({ x: -9999, y: -9999 });
  const lastMoveRef = useRef(0);
  const targetOpacityRef = useRef(0);
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = 0;

    function handlePointerMove(event: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      targetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      lastMoveRef.current = performance.now();

      if (targetOpacityRef.current < 0.85) {
        glowRef.current.opacity = 1;
      }

      targetOpacityRef.current = 1;
      hasEnteredRef.current = true;
    }

    function handlePointerLeave() {
      lastMoveRef.current = 0;
      targetOpacityRef.current = 0;
    }

    function tick(now: number) {
      const glow = glowRef.current;
      const target = targetRef.current;

      glow.x = lerp(glow.x, target.x, POSITION_LERP);
      glow.y = lerp(glow.y, target.y, POSITION_LERP);

      if (hasEnteredRef.current && lastMoveRef.current > 0) {
        const idleMs = now - lastMoveRef.current;

        if (idleMs >= IDLE_BEFORE_FADE_MS) {
          const fadeProgress = Math.min(
            1,
            (idleMs - IDLE_BEFORE_FADE_MS) / FADE_OUT_MS,
          );
          targetOpacityRef.current = 1 - fadeProgress;
        } else {
          targetOpacityRef.current = 1;
        }
      }

      glow.opacity = lerp(glow.opacity, targetOpacityRef.current, OPACITY_LERP);

      frameId = requestAnimationFrame(tick);
    }

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
    frameId = requestAnimationFrame(tick);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      cancelAnimationFrame(frameId);
    };
  }, [containerRef]);

  return glowRef;
}
