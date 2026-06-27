"use client";

import { FileCode, Link2 } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const POPOVER_PANEL_CLASS =
  "rounded-[8px] border border-white/10 bg-[#1a1a1a] shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

type CanvasLinkEmbedToolProps = {
  onActivate: () => void;
  variant?: "format-toolbar" | "bottom-toolbar";
  active?: boolean;
  isLight?: boolean;
};

export const CanvasLinkEmbedTool = forwardRef<
  HTMLButtonElement,
  CanvasLinkEmbedToolProps
>(function CanvasLinkEmbedTool(
  { onActivate, variant = "format-toolbar", active = false, isLight = false },
  ref,
) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({
      top: rect.top - 4,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const showPopover = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    updatePosition();
    setVisible(true);
  }, [updatePosition]);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = null;
    }, 140);
  }, []);

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

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  function handleActivate(event: MouseEvent) {
    event.stopPropagation();
    setVisible(false);
    onActivate();
  }

  const isBottom = variant === "bottom-toolbar";
  const Icon = isBottom ? FileCode : Link2;

  return (
    <>
      <button
        ref={setRefs}
        type="button"
        aria-label="Create link"
        title="Create link"
        aria-expanded={visible}
        aria-pressed={isBottom ? active : undefined}
        onMouseEnter={showPopover}
        onMouseLeave={scheduleHide}
        onFocus={showPopover}
        onClick={handleActivate}
        className={cn(
          "inline-flex items-center justify-center transition-colors",
          isBottom
            ? cn(
                "size-9 rounded-full",
                active
                  ? "bg-[#18a0fb] text-white"
                  : isLight
                    ? "text-[#1a1a1a]/80 hover:bg-black/[0.08] hover:text-[#1a1a1a]"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
              )
            : "size-7 rounded-md text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon className={isBottom ? "size-4" : "size-3.5"} />
      </button>
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-label="Add link embed"
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-auto fixed z-[200] -translate-x-1/2 -translate-y-full"
            onMouseEnter={showPopover}
            onMouseLeave={scheduleHide}
          >
            <div
              className={cn(
                POPOVER_PANEL_CLASS,
                "relative w-[11.5rem] px-3 py-2.5 text-left",
              )}
            >
              <p className="text-[0.6875rem] font-medium text-white">Add link embed</p>
              <p className="mt-1 text-[0.625rem] leading-relaxed text-white/55">
                Place a frame on the canvas, then paste any URL or HTML
              </p>
              <button
                type="button"
                onClick={handleActivate}
                className="mt-2 inline-flex rounded-[4px] bg-[#18a0fb] px-2 py-0.5 text-[0.625rem] font-semibold text-white transition-colors hover:bg-[#1590e8]"
              >
                Click to place
              </button>
              <span
                aria-hidden
                className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border border-white/10 border-t-0 border-l-0 bg-[#1a1a1a]"
              />
            </div>
            <div
              aria-hidden
              className="absolute -bottom-3 left-1/2 h-3 w-20 -translate-x-1/2"
            />
          </div>,
          document.body,
        )}
    </>
  );
});

export function CanvasToolbarDivider({ isLight = false }: { isLight?: boolean }) {
  return (
    <div
      className={cn(
        "mx-0.5 h-5 w-px",
        isLight ? "bg-black/20" : "bg-white/30",
      )}
      aria-hidden
    />
  );
}
