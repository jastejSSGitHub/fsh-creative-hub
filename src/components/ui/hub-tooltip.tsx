"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type HubTooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
};

export function HubTooltip({
  label,
  children,
  className,
  side = "bottom",
}: HubTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 10;

    setCoords({
      top: side === "top" ? rect.top - gap : rect.bottom + gap,
      left: rect.left + rect.width / 2,
    });
  }, [side]);

  useEffect(() => {
    if (!visible) return;

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, updatePosition]);

  function show() {
    updatePosition();
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-block", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{
              top: coords.top,
              left: coords.left,
            }}
            className={cn(
              "pointer-events-none fixed z-[200] max-w-[16rem] -translate-x-1/2 whitespace-normal rounded-[6px] border border-hub-espresso/12 bg-hub-espresso px-2.5 py-1.5 text-center text-[0.6875rem] font-medium tracking-tight text-hub-paper shadow-[0_8px_24px_rgba(11,11,11,0.22)]",
              side === "top" ? "-translate-y-full" : "translate-y-0",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute left-1/2 size-2 -translate-x-1/2 rotate-45 border border-hub-espresso/12 bg-hub-espresso",
                side === "top"
                  ? "-bottom-1 border-t-0 border-l-0"
                  : "-top-1 border-b-0 border-r-0",
              )}
            />
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
