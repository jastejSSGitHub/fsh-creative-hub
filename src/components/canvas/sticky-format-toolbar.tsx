"use client";

import { Bold, Check, ChevronDown, Copy, List, ListTodo, Strikethrough, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { STICKY_COLORS } from "@/lib/canvas/presets";
import {
  STICKY_EMOJI_PICKER_EMOJIS,
  STICKY_TOOLBAR_EMOJI_TRIGGER,
} from "@/lib/canvas/sticky-emojis";
import type { CanvasTextSize, StickyColorId } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";
import { CanvasLinkEmbedTool, CanvasToolbarDivider } from "@/components/canvas/canvas-link-embed-tool";

type StickyFormatToolbarProps = {
  color: StickyColorId;
  textSize: CanvasTextSize;
  bold: boolean;
  strikethrough: boolean;
  onChange: (patch: {
    color?: StickyColorId;
    textSize?: CanvasTextSize;
    bold?: boolean;
    strikethrough?: boolean;
  }) => void;
  onInsertEmoji: (emoji: string) => void;
  onAddLink?: () => void;
  showLinkEmbed?: boolean;
  onCopy?: () => void;
  onCreateTask?: () => void;
  canDelete?: boolean;
  onDelete: () => void;
};

const TOOLBAR_STICKY_COLORS: StickyColorId[] = ["yellow", "blue", "green", "pink"];

const SIZE_OPTIONS: CanvasTextSize[] = ["small", "medium", "large", "extra-large"];

const SIZE_LABELS: Record<CanvasTextSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  "extra-large": "Extra large",
};

const POPOVER_PANEL_CLASS =
  "rounded-[8px] border border-white/10 bg-[#1a1a1a] shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

export function StickyFormatToolbar({
  color,
  textSize,
  bold,
  strikethrough,
  onChange,
  onInsertEmoji,
  onAddLink,
  showLinkEmbed = true,
  onCopy,
  onCreateTask,
  canDelete = true,
  onDelete,
}: StickyFormatToolbarProps) {
  return (
    <div
      data-sticky-toolbar
      className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#1a1a1a] px-2 py-1.5 shadow-xl"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <StickyColorPicker color={color} onChange={(next) => onChange({ color: next })} />

      <StickyEmojiPicker onInsertEmoji={onInsertEmoji} />

      <TextSizeMenu
        value={textSize}
        onChange={(next) => onChange({ textSize: next })}
      />

      <ToolbarToggle
        active={bold}
        label="Bold"
        tooltip="Bold"
        onClick={() => onChange({ bold: !bold })}
      >
        <Bold className="size-3.5" />
      </ToolbarToggle>

      <ToolbarToggle
        active={strikethrough}
        label="Strikethrough"
        tooltip="Strikethrough"
        onClick={() => onChange({ strikethrough: !strikethrough })}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarToggle>

      {showLinkEmbed ? (
        <CanvasLinkEmbedTool onActivate={onAddLink ?? (() => undefined)} />
      ) : null}

      <ToolbarButton label="Bullet list" tooltip="Bullet list (coming soon)" comingSoon>
        <List className="size-3.5" />
      </ToolbarButton>

      <CanvasToolbarDivider />

      {onCreateTask ? (
        <ToolbarButton
          label="Create task"
          tooltip="Create task from sticky"
          onClick={(event) => {
            event.stopPropagation();
            onCreateTask();
          }}
        >
          <ListTodo className="size-3.5" />
        </ToolbarButton>
      ) : null}

      {onCopy ? (
        <ToolbarButton
          label="Copy sticky"
          tooltip="Duplicate sticky"
          onClick={(event) => {
            event.stopPropagation();
            onCopy();
          }}
        >
          <Copy className="size-3.5" />
        </ToolbarButton>
      ) : null}

      {canDelete ? (
        <ToolbarButton
          label="Delete sticky"
          tooltip="Delete sticky"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="text-white/60 hover:bg-[#ef4444]/20 hover:text-[#fca5a5]"
        >
          <Trash2 className="size-3.5" />
        </ToolbarButton>
      ) : null}
    </div>
  );
}

function useToolbarPopover() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({
      top: rect.top - 6,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (open) {
        close();
        return;
      }
      updatePosition();
      setOpen(true);
    },
    [open, close, updatePosition],
  );

  useEffect(() => {
    if (!open) return;

    updatePosition();

    let cleanup: (() => void) | undefined;

    const timer = window.setTimeout(() => {
      function handlePointerDown(event: globalThis.PointerEvent) {
        const target = event.target as Node;
        if (
          triggerRef.current?.contains(target) ||
          menuRef.current?.contains(target)
        ) {
          return;
        }
        close();
      }

      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") close();
      }

      window.addEventListener("pointerdown", handlePointerDown, true);
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      cleanup = () => {
        window.removeEventListener("pointerdown", handlePointerDown, true);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, 0);

    return () => {
      window.clearTimeout(timer);
      cleanup?.();
    };
  }, [open, close, updatePosition]);

  return {
    triggerRef,
    menuRef,
    open,
    coords,
    close,
    toggle,
    updatePosition,
  };
}

function StickyColorPicker({
  color,
  onChange,
}: {
  color: StickyColorId;
  onChange: (color: StickyColorId) => void;
}) {
  const { triggerRef, menuRef, open, coords, close, toggle } = useToolbarPopover();
  const swatch = STICKY_COLORS[color];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Sticky color"
        aria-haspopup="listbox"
        aria-expanded={open}
        onPointerDown={toggle}
        className="inline-flex h-7 items-center gap-1 rounded-md bg-white/[0.06] px-1.5 transition-colors hover:bg-white/10"
      >
        <span
          className="size-5 shrink-0 rounded-full border-2 border-white/30"
          style={{ backgroundColor: swatch.fill }}
          aria-hidden
        />
        <ChevronDown
          className={cn(
            "size-3 text-white/55 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            data-sticky-toolbar-popover
            role="listbox"
            aria-label="Sticky color"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[9999] -translate-x-1/2 -translate-y-full"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={cn(POPOVER_PANEL_CLASS, "px-2 py-2")}>
              <div className="flex items-center gap-1.5">
                {TOOLBAR_STICKY_COLORS.map((id) => {
                  const option = STICKY_COLORS[id];
                  const selected = color === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-label={option.label}
                      aria-selected={selected}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        onChange(id);
                        close();
                      }}
                      className={cn(
                        "relative size-7 rounded-full border-2 transition-transform hover:scale-105",
                        selected
                          ? "border-white ring-2 ring-[#18a0fb] ring-offset-1 ring-offset-[#1a1a1a]"
                          : "border-black/10 hover:border-white/40",
                      )}
                      style={{ backgroundColor: option.fill }}
                    >
                      {selected ? (
                        <Check className="absolute inset-0 m-auto size-3.5 text-black/55" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <span
              aria-hidden
              className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border border-white/10 border-t-0 border-l-0 bg-[#1a1a1a]"
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function StickyEmojiPicker({
  onInsertEmoji,
}: {
  onInsertEmoji: (emoji: string) => void;
}) {
  const { triggerRef, menuRef, open, coords, toggle } = useToolbarPopover();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Insert emoji"
        aria-haspopup="listbox"
        aria-expanded={open}
        onPointerDown={toggle}
        className="inline-flex h-7 items-center gap-0.5 rounded-md bg-white/[0.06] px-1.5 text-base leading-none transition-colors hover:bg-white/10"
      >
        <span aria-hidden>{STICKY_TOOLBAR_EMOJI_TRIGGER}</span>
        <ChevronDown
          className={cn(
            "size-3 text-white/55 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            data-sticky-toolbar-popover
            role="listbox"
            aria-label="Insert emoji"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[9999] -translate-x-1/2 -translate-y-full"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={cn(POPOVER_PANEL_CLASS, "w-[15.875rem] p-2")}>
              <p className="px-1 pb-1.5 text-[0.625rem] font-medium uppercase tracking-wider text-white/40">
                Emojis
              </p>
              <div className="hub-scrollbar-hidden grid max-h-[9.5rem] grid-cols-8 gap-0.5 overflow-x-hidden overflow-y-auto">
                {STICKY_EMOJI_PICKER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    role="option"
                    aria-label={`Insert ${emoji}`}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      onInsertEmoji(emoji);
                    }}
                    className="flex size-7 items-center justify-center rounded-[4px] text-base transition-colors hover:bg-white/10"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <span
              aria-hidden
              className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border border-white/10 border-t-0 border-l-0 bg-[#1a1a1a]"
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function TextSizeMenu({
  value,
  onChange,
}: {
  value: CanvasTextSize;
  onChange: (size: CanvasTextSize) => void;
}) {
  const { triggerRef, menuRef, open, coords, close, toggle } = useToolbarPopover();

  return (
    <>
      <SimpleTooltip label="Text size" side="top">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Text size"
          aria-haspopup="listbox"
          aria-expanded={open}
          onPointerDown={toggle}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-white/10 px-2 text-[0.6875rem] font-medium text-white transition-colors hover:bg-white/[0.14]"
        >
          {SIZE_LABELS[value]}
          <ChevronDown
            className={cn(
              "size-3 text-white/55 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </SimpleTooltip>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            data-sticky-toolbar-popover
            role="listbox"
            aria-label="Text size"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[9999] -translate-x-1/2 -translate-y-full"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={cn(POPOVER_PANEL_CLASS, "min-w-[8.5rem] py-1")}>
              {SIZE_OPTIONS.map((size) => {
                const selected = size === value;
                return (
                  <button
                    key={size}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      onChange(size);
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[0.75rem] transition-colors",
                      selected
                        ? "bg-[#18a0fb]/15 text-white"
                        : "text-white/75 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <span>{SIZE_LABELS[size]}</span>
                    {selected ? (
                      <Check className="size-3.5 shrink-0 text-[#18a0fb]" aria-hidden />
                    ) : (
                      <span className="size-3.5 shrink-0" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
            <span
              aria-hidden
              className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border border-white/10 border-t-0 border-l-0 bg-[#1a1a1a]"
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function SimpleTooltip({
  label,
  side,
  children,
}: {
  label: string;
  side: "top" | "bottom";
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({
      top: side === "top" ? rect.top - 10 : rect.bottom + 10,
      left: rect.left + rect.width / 2,
    });
  }, [side]);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={() => {
          updatePosition();
          setVisible(true);
        }}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </span>
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className={cn(
              "pointer-events-none fixed z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-white/10 bg-[#1a1a1a] px-2.5 py-1 text-[0.6875rem] font-medium text-white shadow-lg",
              side === "top" ? "-translate-y-full" : "translate-y-0",
            )}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}

function ToolbarToggle({
  active,
  label,
  tooltip,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  tooltip: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <SimpleTooltip label={tooltip} side="top">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10",
          active && "bg-[#7c3aed] text-white",
        )}
      >
        {children}
      </button>
    </SimpleTooltip>
  );
}

function ToolbarButton({
  label,
  tooltip,
  onClick,
  comingSoon,
  className,
  children,
}: {
  label: string;
  tooltip: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  comingSoon?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SimpleTooltip label={tooltip} side="top">
      <button
        type="button"
        aria-label={label}
        aria-disabled={comingSoon || undefined}
        onClick={
          comingSoon
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
              }
            : onClick
        }
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white",
          comingSoon && "cursor-not-allowed opacity-45",
          className,
        )}
      >
        {children}
      </button>
    </SimpleTooltip>
  );
}
