const VIEWPORT_PAD = 16;
const CARD_GAP = 14;

export type CardPosition = {
  top: number;
  left: number;
};

export type SpotlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
};

export function clampCardPosition(
  targetRect: DOMRect,
  cardWidth: number,
  cardHeight: number,
  placement: "below" | "above" = "below",
): CardPosition {
  let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
  left = Math.max(
    VIEWPORT_PAD,
    Math.min(left, window.innerWidth - cardWidth - VIEWPORT_PAD),
  );

  let top =
    placement === "below"
      ? targetRect.bottom + CARD_GAP
      : targetRect.top - cardHeight - CARD_GAP;

  if (top + cardHeight > window.innerHeight - VIEWPORT_PAD) {
    top = targetRect.top - cardHeight - CARD_GAP;
  }
  if (top < VIEWPORT_PAD) {
    top = VIEWPORT_PAD;
  }

  return { top, left };
}

export function centerCardPosition(
  cardWidth: number,
  cardHeight: number,
): CardPosition {
  return {
    top: Math.max(
      VIEWPORT_PAD,
      window.innerHeight / 2 - cardHeight / 2,
    ),
    left: Math.max(
      VIEWPORT_PAD,
      window.innerWidth / 2 - cardWidth / 2,
    ),
  };
}

export function rectWithPadding(rect: DOMRect, pad = 8): SpotlightRect {
  return {
    x: rect.left - pad,
    y: rect.top - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    radius: 12,
  };
}

export function mergeRects(a: DOMRect, b: DOMRect): DOMRect {
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  const right = Math.max(a.right, b.right);
  const bottom = Math.max(a.bottom, b.bottom);

  return new DOMRect(left, top, right - left, bottom - top);
}
