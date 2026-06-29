"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DynamicAddButtonProps = {
  onClick: () => void;
};

export function DynamicAddButton({ onClick }: DynamicAddButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setPosition({
      x: Math.max(16, window.innerWidth - 72),
      y: Math.max(16, window.innerHeight - 120),
    });
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragging.current = false;
    offset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    dragging.current = true;
    setPosition({
      x: Math.min(
        window.innerWidth - 56,
        Math.max(8, event.clientX - offset.current.x),
      ),
      y: Math.min(
        window.innerHeight - 56,
        Math.max(8, event.clientY - offset.current.y),
      ),
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!dragging.current) onClick();
  }

  return (
    <button
      type="button"
      aria-label="Add task"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed z-50 flex size-14 items-center justify-center rounded-full bg-hub-primary text-white shadow-lg transition-transform active:scale-95 lg:hidden"
      style={{ left: position.x, top: position.y }}
    >
      <Plus className="size-6" strokeWidth={2.5} />
    </button>
  );
}
