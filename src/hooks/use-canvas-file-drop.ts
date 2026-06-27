"use client";

import { useCallback, useRef, useState } from "react";

import { dataTransferHasCanvasImages } from "@/lib/canvas/image-upload";

type WorldPoint = { x: number; y: number };

type UseCanvasFileDropOptions = {
  enabled?: boolean;
  screenToWorld: (clientX: number, clientY: number) => WorldPoint;
  onDropFiles: (
    files: File[],
    worldPoint: WorldPoint,
    clientX: number,
    clientY: number,
  ) => void | Promise<void>;
};

export function useCanvasFileDrop({
  enabled = true,
  screenToWorld,
  onDropFiles,
}: UseCanvasFileDropOptions) {
  const [active, setActive] = useState(false);
  const [worldPoint, setWorldPoint] = useState<WorldPoint | null>(null);
  const dragDepthRef = useRef(0);

  const resetDrag = useCallback(() => {
    dragDepthRef.current = 0;
    setActive(false);
    setWorldPoint(null);
  }, []);

  const onDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!enabled || !dataTransferHasCanvasImages(event.dataTransfer)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setActive(true);
      setWorldPoint(screenToWorld(event.clientX, event.clientY));
    },
    [enabled, screenToWorld],
  );

  const onDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!enabled || !dataTransferHasCanvasImages(event.dataTransfer)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setActive(true);
      setWorldPoint(screenToWorld(event.clientX, event.clientY));
    },
    [enabled, screenToWorld],
  );

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!dataTransferHasCanvasImages(event.dataTransfer)) return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setActive(false);
      setWorldPoint(null);
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!enabled) return;
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );
      const point = screenToWorld(event.clientX, event.clientY);
      resetDrag();
      if (files.length) {
        void onDropFiles(files, point, event.clientX, event.clientY);
      }
    },
    [enabled, onDropFiles, resetDrag, screenToWorld],
  );

  return {
    active,
    worldPoint,
    handlers: {
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
    },
  };
}
