"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Copy,
  CopyPlus,
  Italic,
  Trash2,
  Underline,
} from "lucide-react";
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

import { CanvasToolbarDivider } from "@/components/canvas/canvas-link-embed-tool";
import {
  CANVAS_FONT_FAMILIES,
  TEXT_COLOR_PRESETS,
  TEXT_SIZE_LABELS,
} from "@/lib/canvas/text-presets";
import type {
  CanvasFontFamily,
  CanvasTextSize,
  TextAlign,
} from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

const SIZE_OPTIONS: CanvasTextSize[] = ["small", "medium", "large", "extra-large"];

const POPOVER_PANEL_CLASS =
  "rounded-[8px] border border-white/10 bg-[#1a1a1a] shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

export type TextFormatPatch = {
  color?: string;
  fontFamily?: CanvasFontFamily;
  textSize?: CanvasTextSize;
  align?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
};

type TextFormatToolbarProps = {
  color: string;
  fontFamily: CanvasFontFamily;
  textSize: CanvasTextSize;
  align: TextAlign;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
  lowercase: boolean;
  onChange: (patch: TextFormatPatch) => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function TextFormatToolbar({
  color,
  fontFamily,
  textSize,
  align,
  bold,
  italic,
  underline,
  uppercase,
  lowercase,
  onChange,
  onCopy,
  onDuplicate,
  onDelete,
}: TextFormatToolbarProps) {
  return (
    <div
      data-text-toolbar
      className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#1a1a1a] px-2 py-1.5 shadow-xl"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <TextColorPicker color={color} onChange={(next) => onChange({ color: next })} />

      <FontFamilyMenu
        value={fontFamily}
        onChange={(next) => onChange({ fontFamily: next })}
      />

      <TextSizeMenu
        value={textSize}
        onChange={(next) => onChange({ textSize: next })}
      />

      <CanvasToolbarDivider />

      <ToolbarToggle
        active={bold}
        label="Bold"
        tooltip="Bold"
        onClick={() => onChange({ bold: !bold })}
      >
        <Bold className="size-3.5" />
      </ToolbarToggle>

      <ToolbarToggle
        active={italic}
        label="Italic"
        tooltip="Italic"
        onClick={() => onChange({ italic: !italic })}
      >
        <Italic className="size-3.5" />
      </ToolbarToggle>

      <ToolbarToggle
        active={underline}
        label="Underline"
        tooltip="Underline"
        onClick={() => onChange({ underline: !underline })}
      >
        <Underline className="size-3.5" />
      </ToolbarToggle>

      <ToolbarToggle
        active={uppercase}
        label="Uppercase"
        tooltip="Uppercase"
        onClick={() =>
          onChange({
            uppercase: !uppercase,
            lowercase: !uppercase ? false : lowercase,
          })
        }
      >
        <span className="text-[0.625rem] font-semibold tracking-tight">AA</span>
      </ToolbarToggle>

      <ToolbarToggle
        active={lowercase}
        label="Lowercase"
        tooltip="Lowercase"
        onClick={() =>
          onChange({
            lowercase: !lowercase,
            uppercase: !lowercase ? false : uppercase,
          })
        }
      >
        <span className="text-[0.625rem] font-semibold tracking-tight">aa</span>
      </ToolbarToggle>

      <TextAlignMenu value={align} onChange={(next) => onChange({ align: next })} />

      <CanvasToolbarDivider />

      <ToolbarButton
        label="Copy text"
        tooltip="Copy"
        onClick={(event) => {
          event.stopPropagation();
          onCopy();
        }}
      >
        <Copy className="size-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Duplicate text"
        tooltip="Duplicate"
        onClick={(event) => {
          event.stopPropagation();
          onDuplicate();
        }}
      >
        <CopyPlus className="size-3.5" />
      </ToolbarButton>

      <ToolbarButton
        label="Delete text"
        tooltip="Delete text"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="text-white/60 hover:bg-[#ef4444]/20 hover:text-[#fca5a5]"
      >
        <Trash2 className="size-3.5" />
      </ToolbarButton>
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
  };
}

function TextColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const { triggerRef, menuRef, open, coords, close, toggle } = useToolbarPopover();
  const swatch =
    TEXT_COLOR_PRESETS.find((entry) => entry.value === color)?.value ?? color;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Text color"
        aria-haspopup="listbox"
        aria-expanded={open}
        onPointerDown={toggle}
        className="inline-flex h-7 items-center gap-1 rounded-md bg-white/[0.06] px-1.5 transition-colors hover:bg-white/10"
      >
        <span
          className="size-5 shrink-0 rounded-full border-2 border-white/30"
          style={{ backgroundColor: swatch }}
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
            data-text-toolbar-popover
            role="listbox"
            aria-label="Text color"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[200] -translate-x-1/2 -translate-y-full"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={cn(POPOVER_PANEL_CLASS, "px-2 py-2")}>
              <div className="flex flex-wrap items-center gap-1.5">
                {TEXT_COLOR_PRESETS.map((preset) => {
                  const selected = color === preset.value;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="option"
                      aria-label={preset.label}
                      aria-selected={selected}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        onChange(preset.value);
                        close();
                      }}
                      className={cn(
                        "relative size-7 rounded-full border-2 transition-transform hover:scale-105",
                        selected
                          ? "border-white ring-2 ring-[#18a0fb] ring-offset-1 ring-offset-[#1a1a1a]"
                          : "border-black/10 hover:border-white/40",
                      )}
                      style={{ backgroundColor: preset.value }}
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

function FontFamilyMenu({
  value,
  onChange,
}: {
  value: CanvasFontFamily;
  onChange: (font: CanvasFontFamily) => void;
}) {
  const { triggerRef, menuRef, open, coords, close, toggle } = useToolbarPopover();
  const current = CANVAS_FONT_FAMILIES[value];

  return (
    <>
      <SimpleTooltip label="Font" side="top">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Font family"
          aria-haspopup="listbox"
          aria-expanded={open}
          onPointerDown={toggle}
          className="inline-flex h-7 min-w-[2.75rem] items-center gap-1 rounded-md bg-white/[0.06] px-2 text-[0.6875rem] font-medium text-white transition-colors hover:bg-white/10"
          style={{ fontFamily: current.css }}
        >
          <span>Aa</span>
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
            data-text-toolbar-popover
            role="listbox"
            aria-label="Font family"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[200] -translate-x-1/2 -translate-y-full"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={cn(POPOVER_PANEL_CLASS, "min-w-[11rem] py-1")}>
              {(Object.keys(CANVAS_FONT_FAMILIES) as CanvasFontFamily[]).map(
                (id) => {
                  const option = CANVAS_FONT_FAMILIES[id];
                  const selected = id === value;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        onChange(id);
                        close();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[0.75rem] transition-colors",
                        selected
                          ? "bg-[#18a0fb]/15 text-white"
                          : "text-white/75 hover:bg-white/8 hover:text-white",
                      )}
                      style={{ fontFamily: option.css }}
                    >
                      <span>{option.label}</span>
                      {selected ? (
                        <Check className="size-3.5 shrink-0 text-[#18a0fb]" aria-hidden />
                      ) : (
                        <span className="size-3.5 shrink-0" aria-hidden />
                      )}
                    </button>
                  );
                },
              )}
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
      <SimpleTooltip label="Font size" side="top">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Font size"
          aria-haspopup="listbox"
          aria-expanded={open}
          onPointerDown={toggle}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-white/10 px-2 text-[0.6875rem] font-medium text-white transition-colors hover:bg-white/[0.14]"
        >
          {TEXT_SIZE_LABELS[value]}
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
            data-text-toolbar-popover
            role="listbox"
            aria-label="Font size"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[200] -translate-x-1/2 -translate-y-full"
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
                    <span>{TEXT_SIZE_LABELS[size]}</span>
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

function TextAlignMenu({
  value,
  onChange,
}: {
  value: TextAlign;
  onChange: (align: TextAlign) => void;
}) {
  const { triggerRef, menuRef, open, coords, close, toggle } = useToolbarPopover();
  const Icon = value === "center" ? AlignCenter : value === "right" ? AlignRight : AlignLeft;

  return (
    <>
      <SimpleTooltip label="Alignment" side="top">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Text alignment"
          aria-haspopup="listbox"
          aria-expanded={open}
          onPointerDown={toggle}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-white/[0.06] px-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon className="size-3.5" />
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
            data-text-toolbar-popover
            role="listbox"
            aria-label="Text alignment"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[200] -translate-x-1/2 -translate-y-full"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={cn(POPOVER_PANEL_CLASS, "min-w-[8.5rem] py-1")}>
              {(
                [
                  ["left", AlignLeft, "Align left"],
                  ["center", AlignCenter, "Align center"],
                  ["right", AlignRight, "Align right"],
                ] as const
              ).map(([align, AlignIcon, label]) => {
                const selected = align === value;
                return (
                  <button
                    key={align}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      onChange(align);
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[0.75rem] transition-colors",
                      selected
                        ? "bg-[#18a0fb]/15 text-white"
                        : "text-white/75 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <AlignIcon className="size-3.5 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {selected ? (
                      <Check className="size-3.5 shrink-0 text-[#18a0fb]" aria-hidden />
                    ) : null}
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
              "pointer-events-none fixed z-[200] -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-white/10 bg-[#1a1a1a] px-2.5 py-1 text-[0.6875rem] font-medium text-white shadow-lg",
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
  className,
  children,
}: {
  label: string;
  tooltip: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SimpleTooltip label={tooltip} side="top">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white",
          className,
        )}
      >
        {children}
      </button>
    </SimpleTooltip>
  );
}
