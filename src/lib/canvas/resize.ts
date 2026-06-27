export type ResizeHandle =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

export type ResizeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResizeBounds = {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
};

export function computeRawResizeRect(
  handle: ResizeHandle,
  origin: ResizeRect,
  deltaX: number,
  deltaY: number,
): ResizeRect {
  let { x, y, width, height } = origin;

  if (handle.includes("e")) width += deltaX;
  if (handle.includes("w")) {
    width -= deltaX;
    x += deltaX;
  }
  if (handle.includes("s")) height += deltaY;
  if (handle.includes("n")) {
    height -= deltaY;
    y += deltaY;
  }

  return { x, y, width, height };
}

export type ResizeClampHit = "minWidth" | "minHeight" | "maxWidth" | "maxHeight";

export function getResizeClampHits(
  handle: ResizeHandle,
  origin: ResizeRect,
  deltaX: number,
  deltaY: number,
  bounds: ResizeBounds,
): ResizeClampHit[] {
  const raw = computeRawResizeRect(handle, origin, deltaX, deltaY);
  const hits: ResizeClampHit[] = [];

  if (raw.width < bounds.minWidth) hits.push("minWidth");
  if (raw.height < bounds.minHeight) hits.push("minHeight");
  if (bounds.maxWidth !== undefined && raw.width > bounds.maxWidth) hits.push("maxWidth");
  if (bounds.maxHeight !== undefined && raw.height > bounds.maxHeight) hits.push("maxHeight");

  return hits;
}

export function computeResizeRect(
  handle: ResizeHandle,
  origin: ResizeRect,
  deltaX: number,
  deltaY: number,
  bounds: ResizeBounds,
): ResizeRect {
  let { x, y, width, height } = computeRawResizeRect(
    handle,
    origin,
    deltaX,
    deltaY,
  );

  if (width < bounds.minWidth) {
    if (handle.includes("w")) {
      x = origin.x + origin.width - bounds.minWidth;
    }
    width = bounds.minWidth;
  }

  if (height < bounds.minHeight) {
    if (handle.includes("n")) {
      y = origin.y + origin.height - bounds.minHeight;
    }
    height = bounds.minHeight;
  }

  if (bounds.maxWidth !== undefined && width > bounds.maxWidth) {
    if (handle.includes("w")) {
      x = origin.x + origin.width - bounds.maxWidth;
    }
    width = bounds.maxWidth;
  }

  if (bounds.maxHeight !== undefined && height > bounds.maxHeight) {
    if (handle.includes("n")) {
      y = origin.y + origin.height - bounds.maxHeight;
    }
    height = bounds.maxHeight;
  }

  return { x, y, width, height };
}

export const RESIZE_HANDLE_CURSORS: Record<ResizeHandle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

export const RESIZE_HANDLES: ResizeHandle[] = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
];

type ResizeHandleStyle = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  transform: string;
};

export function resizeHandlePosition(handle: ResizeHandle): ResizeHandleStyle {
  const edgeOffset = "0px";
  const center = "50%";

  switch (handle) {
    case "nw":
      return { top: edgeOffset, left: edgeOffset, transform: "translate(-50%, -50%)" };
    case "n":
      return { top: edgeOffset, left: center, transform: "translate(-50%, -50%)" };
    case "ne":
      return { top: edgeOffset, right: edgeOffset, transform: "translate(50%, -50%)" };
    case "e":
      return { top: center, right: edgeOffset, transform: "translate(50%, -50%)" };
    case "se":
      return { bottom: edgeOffset, right: edgeOffset, transform: "translate(50%, 50%)" };
    case "s":
      return { bottom: edgeOffset, left: center, transform: "translate(-50%, 50%)" };
    case "sw":
      return { bottom: edgeOffset, left: edgeOffset, transform: "translate(-50%, 50%)" };
    case "w":
      return { top: center, left: edgeOffset, transform: "translate(-50%, -50%)" };
  }
}
