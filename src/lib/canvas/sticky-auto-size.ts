import {
  STICKY_MAX_HEIGHT,
  STICKY_MIN_HEIGHT,
} from "@/lib/canvas/presets";

function measureNaturalScrollHeight(textarea: HTMLTextAreaElement): number {
  const previousHeight = textarea.style.height;
  const previousOverflow = textarea.style.overflow;

  textarea.style.height = "0px";
  textarea.style.overflow = "hidden";
  const measured = textarea.scrollHeight;

  textarea.style.height = previousHeight;
  textarea.style.overflow = previousOverflow;

  return measured;
}

export function measureStickyTextHeight(textarea: HTMLTextAreaElement): number {
  const measured = Math.max(STICKY_MIN_HEIGHT, measureNaturalScrollHeight(textarea));
  return Math.min(STICKY_MAX_HEIGHT, measured);
}

export function stickyTextWouldOverflow(
  textarea: HTMLTextAreaElement,
  nextText: string,
): boolean {
  const previousValue = textarea.value;
  textarea.value = nextText;
  const naturalHeight = measureNaturalScrollHeight(textarea);
  textarea.value = previousValue;
  return naturalHeight > STICKY_MAX_HEIGHT;
}
