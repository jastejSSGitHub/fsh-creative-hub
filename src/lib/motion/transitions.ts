import type { Transition } from "framer-motion";

type SpringOptions = {
  stiffness?: number;
  damping?: number;
};

type LoopOptions = {
  duration?: number;
  repeat?: number;
  ease?: Transition["ease"];
};

/** Framer Motion spring/inertia transitions only support two keyframes. */
export function springTransition({
  stiffness = 400,
  damping = 22,
}: SpringOptions = {}): Transition {
  return { type: "spring", stiffness, damping };
}

/** Use for looping or 3+ keyframe value arrays (scale, opacity, etc.). */
export function loopTransition({
  duration = 0.55,
  repeat = Infinity,
  ease = "easeInOut",
}: LoopOptions = {}): Transition {
  return { duration, repeat, ease };
}

export function isMultiKeyframe(value: unknown): value is readonly unknown[] {
  return Array.isArray(value) && value.length > 2;
}

/** Picks spring for single/from-to values, tween loop for 3+ keyframes. */
export function transitionForValue(
  value: unknown,
  spring: SpringOptions = {},
  loop: LoopOptions = {},
): Transition {
  return isMultiKeyframe(value) ? loopTransition(loop) : springTransition(spring);
}

/** Per-property helper when scale may pulse with 3 keyframes while other props use spring. */
export function mixedScaleTransition(
  scale: number | readonly number[],
  spring: SpringOptions = {},
  loop: LoopOptions = {},
): Transition {
  if (isMultiKeyframe(scale)) {
    return {
      scale: loopTransition(loop),
      default: springTransition(spring),
    };
  }

  return springTransition(spring);
}
